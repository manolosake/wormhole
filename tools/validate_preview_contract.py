#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


REQUIRED_METRICS_KEYS = {
    "fpsAvg",
    "frameMs",
    "frameCount",
    "timestamp",
    "preset",
    "params",
    "realismScore",
    "stabilityScore",
}

REQUIRED_EVAL_KEYS = {
    "timestamp",
    "checks",
    "realismScore",
    "guardrails_pass",
    "desktop_scientific_met",
}


def _require(cond: bool, msg: str, errors: list[str]) -> None:
    if not cond:
        errors.append(msg)


def _run_checks(data: dict[str, Any], min_fps: float) -> tuple[list[str], dict[str, Any]]:
    errors: list[str] = []
    run1 = data.get("run1", {})
    run2 = data.get("run2", {})
    drift = data.get("drift", {})

    for tag, run in (("run1", run1), ("run2", run2)):
        _require(isinstance(run, dict), f"{tag} missing", errors)
        _require(float(run.get("avg_fps", 0)) >= min_fps, f"{tag}.avg_fps < {min_fps}", errors)
        _require(bool(run.get("fps_ge_45_all")), f"{tag}.fps_ge_45_all != true", errors)
        _require(bool(run.get("guardrails_pass_all")), f"{tag}.guardrails_pass_all != true", errors)
        contract = run.get("contract", {})
        _require(bool(contract.get("hasCtl")), f"{tag}.contract.hasCtl != true", errors)
        _require(bool(contract.get("hasSetParams")), f"{tag}.contract.hasSetParams != true", errors)
        _require(bool(contract.get("hasGetMetrics")), f"{tag}.contract.hasGetMetrics != true", errors)
        _require(bool(contract.get("hasGetEval")), f"{tag}.contract.hasGetEval != true", errors)
        metrics_keys = set(contract.get("metricsKeys", []))
        eval_keys = set(contract.get("evalKeys", []))
        _require(REQUIRED_METRICS_KEYS.issubset(metrics_keys), f"{tag}.contract.metricsKeys missing required keys", errors)
        _require(REQUIRED_EVAL_KEYS.issubset(eval_keys), f"{tag}.contract.evalKeys missing required keys", errors)

    _require(bool(drift.get("both_pass")), "drift.both_pass != true", errors)

    report = {
        "run1_avg_fps": float(run1.get("avg_fps", 0)),
        "run2_avg_fps": float(run2.get("avg_fps", 0)),
        "run1_min_fps": float(run1.get("min_fps", 0)),
        "run2_min_fps": float(run2.get("min_fps", 0)),
        "drift_avg_fps_delta": float(drift.get("avg_fps_delta", 0)),
        "drift_min_fps_delta": float(drift.get("min_fps_delta", 0)),
        "drift_p95_frame_ms_delta": float(drift.get("p95_frame_ms_delta", 0)),
        "both_pass": bool(drift.get("both_pass")),
        "errors": errors,
    }
    return errors, report


def main() -> int:
    ap = argparse.ArgumentParser(description="Validate preview run1/run2 contract and perf thresholds.")
    ap.add_argument("--summary", required=True, help="path to run_compare_summary.json")
    ap.add_argument("--min-fps", type=float, default=45.0, help="minimum avg fps threshold")
    ap.add_argument("--out", default="", help="optional output report path")
    args = ap.parse_args()

    summary_path = Path(args.summary).expanduser().resolve()
    with summary_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    errors, report = _run_checks(data, args.min_fps)
    if args.out:
        out_path = Path(args.out).expanduser().resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    if errors:
        print("[validate-preview-contract] FAIL")
        for e in errors:
            print(f"- {e}")
        return 1
    print("[validate-preview-contract] PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
