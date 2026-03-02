const fs = require('fs');
const { chromium } = require('playwright-core');

function p95(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.floor(0.95 * (s.length - 1));
  return s[Math.max(0, Math.min(idx, s.length - 1))];
}

async function ensureContract(page) {
  await page.waitForFunction(() => !!(window.__iterCtl && window.__iterCtl.setParams && window.__iterCtl.getMetrics && window.__iterCtl.getEval), null, { timeout: 20000 });
  return page.evaluate(() => ({
    has_iterCtl: typeof window.__iterCtl !== 'undefined',
    has_iterMetrics: typeof window.__iterMetrics !== 'undefined',
    has_iterEval: typeof window.__iterEval !== 'undefined',
    has_setParams: !!(window.__iterCtl && window.__iterCtl.setParams),
    has_getMetrics: !!(window.__iterCtl && window.__iterCtl.getMetrics),
    has_getEval: !!(window.__iterCtl && window.__iterCtl.getEval)
  }));
}

async function captureSnapshot(browser, previewUrl, outDir, name, viewport, preset) {
  const page = await browser.newPage({ viewport });
  await page.goto(previewUrl);
  const contract = await ensureContract(page);
  await page.evaluate((preset) => window.__iterCtl.setParams({ preset }), preset);
  await page.waitForTimeout(2600);
  const metrics = await page.evaluate(() => window.__iterCtl.getMetrics());
  const evalData = await page.evaluate(() => window.__iterCtl.getEval());
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  await page.close();
  return { contract, metrics, eval: evalData };
}

async function run(outDir, previewUrl, chromeBin) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromeBin,
    args: ['--no-sandbox']
  });

  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktopPage.goto(previewUrl);
  const contractDesktop = await ensureContract(desktopPage);
  await desktopPage.evaluate(() => window.__iterCtl.setParams({ preset: 'scientific' }));
  await desktopPage.waitForTimeout(2800);

  const series = [];
  for (let i = 0; i < 30; i++) {
    await desktopPage.waitForTimeout(1000);
    const m = await desktopPage.evaluate(() => window.__iterCtl.getMetrics());
    const e = await desktopPage.evaluate(() => window.__iterCtl.getEval());
    series.push({
      second: i + 1,
      fps: Number(m.fpsAvg || 0),
      frameMs: Number(m.frameMs || 0),
      realismScore: Number(m.realismScore || e.realismScore || 0),
      stabilityScore: Number(m.stabilityScore || 0),
      guardrails_pass: Boolean(e.guardrails_pass)
    });
  }

  const desktopMetrics = await desktopPage.evaluate(() => window.__iterCtl.getMetrics());
  const desktopEval = await desktopPage.evaluate(() => window.__iterCtl.getEval());
  await desktopPage.screenshot({ path: `${outDir}/desktop_scientific.png`, fullPage: true });
  await desktopPage.close();

  const tablet = await captureSnapshot(browser, previewUrl, outDir, 'tablet', { width: 1024, height: 768 }, 'tablet');
  const mobile = await captureSnapshot(browser, previewUrl, outDir, 'mobile', { width: 390, height: 844 }, 'mobile');

  const fps = series.map(r => r.fps);
  const frame = series.map(r => r.frameMs);
  const realism = series.map(r => r.realismScore);
  const stability = series.map(r => r.stabilityScore);

  const summary = {
    samples: series.length,
    avg_fps: Number((fps.reduce((a, b) => a + b, 0) / Math.max(1, fps.length)).toFixed(2)),
    min_fps: Number(Math.min(...fps).toFixed(2)),
    p95_frame_ms: Number(p95(frame).toFixed(2)),
    realism_min: Math.min(...realism),
    stability_min: Number(Math.min(...stability).toFixed(2)),
    fps_ge_45_all: series.every(r => r.fps >= 45),
    guardrails_all_true: series.every(r => r.guardrails_pass)
  };

  const payload = {
    timestamp: new Date().toISOString(),
    preview_url: previewUrl,
    methodology: {
      desktop_duration_seconds: 30,
      sample_rate_hz: 1,
      browser_args: ['--no-sandbox']
    },
    contract: {
      desktop: contractDesktop,
      tablet: tablet.contract,
      mobile: mobile.contract,
      pass_all: [contractDesktop, tablet.contract, mobile.contract].every(c => c.has_iterCtl && c.has_iterMetrics && c.has_iterEval && c.has_setParams && c.has_getMetrics && c.has_getEval)
    },
    desktop_scientific: {
      summary,
      metrics_snapshot: desktopMetrics,
      eval_snapshot: desktopEval,
      series
    },
    tablet_snapshot: tablet,
    mobile_snapshot: mobile
  };

  fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(payload, null, 2));
  await browser.close();
}

(async () => {
  await run(process.env.ASSETS_DIR, process.env.PREVIEW_URL, process.env.CHROME_BIN);
})();
