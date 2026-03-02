# Wormhole Codebase Import

This repository consolidates the wormhole simulation code recovered from server-side execution artifacts.

## Structure

- `src/realtime-webgl/index.html`
  - Realtime WebGL wormhole / white-hole simulation with `__iterCtl`, `__iterMetrics`, and `__iterEval` contract.
- `src/r4-hq-recovery/preview.html`
  - R4 visual coherence recovery variant.
- `tools/run_benchmark_twice.js`
  - Two-run benchmark collector (Playwright).
- `tools/validate_preview_contract.py`
  - Contract and performance threshold validator.
- `qa/qa_final_e2e_probe.js`
  - QA probe used for final 2-run validation.
- `evidence/pass-r5/`
  - PASS gate evidence (report, metrics, and screenshots for run1/run2).

## Notes

This import captures the wormhole implementation and its QA evidence as extracted from runtime artifacts on 2026-03-02.
