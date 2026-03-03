PASS

# R6 VNext QA Gate

- Fecha UTC: `2026-03-03`
- Veredicto único: **PASS**
- URL validada: `https://r530.tail3525c1.ts.net/wormhole`

## Objetivo

Validar la versión VNext con dos modos de render (`live` y `cinematic`) manteniendo contrato público y objetivo de performance para `live`.

## Umbrales aplicados

- `live` average FPS >= `30`
- `live` min FPS floor >= `24`
- Guardrails físicos activos en todas las muestras
- Contrato `__iterCtl/__iterMetrics/__iterEval` completo

## Resultado benchmark (2 corridas de 60s, 2048x1268)

- Run1: `avg_fps=30.03`, `min_fps=30.03`, `p95_frame_ms=33.30`
- Run2: `avg_fps=30.03`, `min_fps=29.96`, `p95_frame_ms=33.30`
- Drift: `avg_fps_delta=0.00`, `min_fps_delta=0.07`, `p95_delta=0.00`
- `both_pass=true`

## Snapshots por modo (2048x1268)

- `live`: `fpsAvg=33.82`, `renderMode=live`, `resolutionScale=1.00`, `raySteps=76`, `live_target_met=true`
- `cinematic`: `fpsAvg=41.19`, `renderMode=cinematic`, `resolutionScale=1.00`, `raySteps=125`

## Contrato y guardrails

- `metricsKeys` contienen: `renderMode`, `resolutionScale`, `raySteps` además de claves históricas.
- `evalKeys` contienen: `live_target_met` además de claves históricas.
- Guardrails (`lensing_active`, `redshift_blueshift_active`, `whitehole_emission_active`) en PASS para ambas corridas.

## Artefactos

- `run_compare_summary.json`
- `validation_report.json`
- `run1_samples.json`, `run2_samples.json`
- `run1_desktop_scientific.png`, `run2_desktop_scientific.png`
- `desktop_live_2048.png`, `desktop_cinematic_2048.png`
- `tablet.png`, `mobile.png`
- `mode_snapshots.json`

