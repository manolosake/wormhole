const fs = require('fs');
const { chromium } = require('playwright-core');

function p95(values) {
  if (!values.length) return 0;
  const s = [...values].sort((a,b)=>a-b);
  return s[Math.min(s.length - 1, Math.floor(0.95 * (s.length - 1)))];
}

async function collectRun(browser, preview, outDir, tag) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(preview);
  await page.waitForFunction(() => !!window.__iterCtl && typeof window.__iterCtl.setParams === 'function', null, { timeout: 20000 });
  await page.evaluate(() => window.__iterCtl.setParams({
    preset: 'scientific', deterministicMode: true,
    lensStrength: 1.22, beta: 0.34, gravShift: 1.20, emission: 1.45, quality: 0.74, exposure: 1.05
  }));
  await page.waitForTimeout(3000);

  const contract = await page.evaluate(() => ({
    hasCtl: !!window.__iterCtl,
    hasSetParams: !!window.__iterCtl?.setParams,
    hasGetMetrics: !!window.__iterCtl?.getMetrics,
    hasGetEval: !!window.__iterCtl?.getEval,
    metricsKeys: Object.keys(window.__iterCtl?.getMetrics?.() || {}),
    evalKeys: Object.keys(window.__iterCtl?.getEval?.() || {}),
  }));

  const rows = [];
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(1000);
    const m = await page.evaluate(() => window.__iterCtl.getMetrics());
    const e = await page.evaluate(() => window.__iterCtl.getEval());
    const checks = e && e.checks ? e.checks : {};
    rows.push({
      second: i + 1,
      fps: Number(m.fpsAvg || 0),
      frameMs: Number(m.frameMs || 0),
      realismScore: Number(m.realismScore || 0),
      stabilityScore: Number(m.stabilityScore || 0),
      guardrails: checks,
      guardrails_pass: Boolean(checks.lensing_active && checks.redshift_blueshift_active && checks.whitehole_emission_active)
    });
  }

  await page.screenshot({ path: `${outDir}/${tag}_desktop_scientific.png`, fullPage: true });

  const fps = rows.map(r => r.fps);
  const ms = rows.map(r => r.frameMs);
  const avg = fps.reduce((a,b)=>a+b,0) / Math.max(1, fps.length);
  const min = fps.length ? Math.min(...fps) : 0;
  const summary = {
    tag,
    duration_seconds: 60,
    samples_count: rows.length,
    avg_fps: Number(avg.toFixed(2)),
    min_fps: Number(min.toFixed(2)),
    p95_frame_ms: Number(p95(ms).toFixed(2)),
    sustained_fps_ge_45: rows.every(r => r.fps >= 45),
    avg_fps_ge_45: avg >= 45,
    fps_ge_45_all: rows.every(r => r.fps >= 45),
    guardrails_pass_all: rows.every(r => r.guardrails_pass),
    contract
  };

  fs.writeFileSync(`${outDir}/${tag}_samples.json`, JSON.stringify(rows, null, 2));
  fs.writeFileSync(`${outDir}/${tag}_summary.json`, JSON.stringify(summary, null, 2));

  await page.close();
  return summary;
}

(async () => {
  const outDir = process.env.ASSETS_DIR;
  const preview = process.env.PREVIEW_URL;
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_BIN,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const run1 = await collectRun(browser, preview, outDir, 'run1');
  const run2 = await collectRun(browser, preview, outDir, 'run2');

  const drift = {
    avg_fps_delta: Number(Math.abs(run1.avg_fps - run2.avg_fps).toFixed(2)),
    min_fps_delta: Number(Math.abs(run1.min_fps - run2.min_fps).toFixed(2)),
    p95_frame_ms_delta: Number(Math.abs(run1.p95_frame_ms - run2.p95_frame_ms).toFixed(2)),
    both_pass: Boolean(run1.avg_fps_ge_45 && run2.avg_fps_ge_45 && run1.fps_ge_45_all && run2.fps_ge_45_all && run1.guardrails_pass_all && run2.guardrails_pass_all)
  };

  const report = {
    timestamp: new Date().toISOString(),
    run1,
    run2,
    drift,
  };

  fs.writeFileSync(`${outDir}/run_compare_summary.json`, JSON.stringify(report, null, 2));

  // extra visual references
  const tab = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await tab.goto(preview);
  await tab.waitForTimeout(1800);
  await tab.evaluate(() => window.__iterCtl.setParams({ preset: 'tablet', deterministicMode: true }));
  await tab.waitForTimeout(1000);
  await tab.screenshot({ path: `${outDir}/tablet.png`, fullPage: true });

  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mob.goto(preview);
  await mob.waitForTimeout(1800);
  await mob.evaluate(() => window.__iterCtl.setParams({ preset: 'mobile', deterministicMode: true }));
  await mob.waitForTimeout(1000);
  await mob.screenshot({ path: `${outDir}/mobile.png`, fullPage: true });

  await browser.close();
})();
