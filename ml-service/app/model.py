from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, Tuple

import numpy as np
import pandas as pd
from dotenv import load_dotenv

from .training import FEATURE_COLUMNS, load_artifact, train_and_save

load_dotenv()

MODEL_PATH = Path(os.getenv("MODEL_PATH", "models/fraud_model.joblib"))
METRICS_PATH = Path(os.getenv("METRICS_PATH", "models/model_metrics.json"))
DATA_PATH = Path(os.getenv("DATA_PATH", "data/sample_transactions.csv"))

artifact: Dict | None = None
metrics_cache: Dict | None = None


def ensure_model(force_reload: bool = False) -> Tuple[Dict, Dict]:
    global artifact, metrics_cache
    if not force_reload and artifact is not None and metrics_cache is not None:
        return artifact, metrics_cache

    if not MODEL_PATH.exists() or not METRICS_PATH.exists():
        metrics_cache = train_and_save(MODEL_PATH, METRICS_PATH, DATA_PATH)
    else:
        metrics_cache = json.loads(METRICS_PATH.read_text(encoding="utf-8"))

    artifact = load_artifact(MODEL_PATH)
    return artifact, metrics_cache


def score_payload(features: Dict) -> Dict:
    current_artifact, current_metrics = ensure_model()
    vector = pd.DataFrame([[features[name] for name in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
    scaled = current_artifact["scaler"].transform(vector)
    anomaly_score = float(-current_artifact["anomaly_model"].decision_function(scaled)[0])
    calibration_vector = np.column_stack([scaled, np.array([anomaly_score])])
    fraud_probability = float(
        current_artifact["calibrator"].predict_proba(calibration_vector)[0][1]
    )

    contributions = {
        "amount_delta_ratio": features["amount_delta_ratio"],
        "velocity_1h": features["velocity_1h"] / 8,
        "location_deviation_km": features["location_deviation_km"] / 500,
        "device_mismatch": features["device_mismatch"] * 1.2,
        "known_device_session": (1 - features["known_device_session"]) * 0.8,
    }
    top_factors = [
        name
        for name, _value in sorted(
            contributions.items(), key=lambda item: item[1], reverse=True
        )[:3]
    ]

    return {
        "fraud_probability": round(min(max(fraud_probability, 0.0), 0.999), 4),
        "anomaly_score": round(max(anomaly_score, 0.0), 4),
        "top_factors": top_factors,
        "metrics": current_metrics,
    }
