# Wormhole Realtime WebGL

This repository hosts the realtime wormhole visualization consumed by ExecutiveDashboard at `/wormhole`.

## Runtime Modes (VNext)

- `live`
  - Interstellar-style balance mode for desktop premium.
  - Target: average FPS >= 30 with per-sample floor >= 24 in high-resolution benchmark.
  - Adaptive scale active (`resolutionScale` in `__iterMetrics`) in the range `0.78..1.00`.
- `cinematic`
  - Max visual fidelity mode.
  - Fixed `resolutionScale=1.0`, higher ray step budget.
  - No hard FPS guarantee.

## Public Runtime Contract

The page exposes:

- `window.__iterCtl.setParams(payload)`
- `window.__iterCtl.getMetrics()`
- `window.__iterCtl.getEval()`

Required compatibility keys remain stable:

- Metrics: `fpsAvg`, `frameMs`, `frameCount`, `timestamp`, `preset`, `params`, `realismScore`, `stabilityScore`
- Eval: `timestamp`, `checks`, `realismScore`, `guardrails_pass`, `desktop_scientific_met`

VNext non-breaking additions:

- Metrics: `renderMode`, `resolutionScale`, `raySteps`
- Eval: `live_target_met`

## Repository Structure

- `src/realtime-webgl/index.html`
  - Main production visualization and HUD controls.
- `src/r4-hq-recovery/preview.html`
  - Legacy recovery variant.
- `tools/run_benchmark_twice.js`
  - Two-run benchmark collector for contract + performance drift.
- `tools/validate_preview_contract.py`
  - Validator for benchmark summaries and required contract keys.
- `qa/qa_final_e2e_probe.js`
  - Legacy probe maintained for compatibility.
- `evidence/pass-r5/`
  - Prior QA gate artifacts.
- `evidence/pass-r6/`
  - VNext QA gate artifacts for live/cinematic rollout.

## VNext Verification Workflow

1. Run 2 benchmark passes:

```bash
NODE_PATH=/tmp/wormhole-validate/node_modules \
CHROME_BIN=/home/aponce/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome \
PREVIEW_URL=https://r530.tail3525c1.ts.net/wormhole \
ASSETS_DIR=/home/aponce/wormhole/evidence/pass-r6 \
node tools/run_benchmark_twice.js
```

2. Validate contract + thresholds:

```bash
python3 tools/validate_preview_contract.py \
  --summary evidence/pass-r6/run_compare_summary.json \
  --out evidence/pass-r6/validation_report.json
```
