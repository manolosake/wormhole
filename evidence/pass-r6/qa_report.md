PASS

# R6 VNext QA Gate

- Fecha UTC: `2026-03-03`
- Veredicto único: **PASS**
- URL validada: `https://r530.tail3525c1.ts.net/wormhole/`

## Objetivo

Validar la versión VNext del wormhole con dos modos de render (`live` y `cinematic`) manteniendo contrato público y objetivo de performance para `live`.

## Umbrales aplicados

- `live` average FPS >= `30`
- `live` min FPS floor >= `24`
- Guardrails físicos activos en todas las muestras
- Contrato `__iterCtl/__iterMetrics/__iterEval` completo

## Resultado benchmark (2 corridas de 60s, 2048x1268)

- Run1: `avg_fps=30.03`, `min_fps=30.03`, `p95_frame_ms=33.30`
- Run2: `avg_fps=45.40`, `min_fps=30.03`, `p95_frame_ms=33.30`
- Drift: `avg_fps_delta=15.37`, `min_fps_delta=0.00`, `p95_delta=0.00`
- `both_pass=true`

## Snapshots por modo (2048x1268)

- `live`: `fpsAvg=34.90`, `renderMode=live`, `resolutionScale=1.00`, `raySteps=76`, `live_target_met=true`
- `cinematic`: `fpsAvg=39.32`, `renderMode=cinematic`, `resolutionScale=1.00`, `raySteps=127`

## Contrato y guardrails

- `metricsKeys` incluyen claves nuevas: `renderMode`, `resolutionScale`, `raySteps`.
- `evalKeys` incluyen clave nueva: `live_target_met`.
- Guardrails (`lensing_active`, `redshift_blueshift_active`, `whitehole_emission_active`) en PASS para ambas corridas.

## Artefactos

- `run_compare_summary.json`
- `validation_report.json`
- `run1_samples.json`, `run2_samples.json`
- `run1_desktop_scientific.png`, `run2_desktop_scientific.png`
- `desktop_live_2048.png`, `desktop_cinematic_2048.png`
- `tablet.png`, `mobile.png`
- `mode_snapshots.json`

