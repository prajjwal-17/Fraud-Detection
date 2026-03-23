from __future__ import annotations

import json
from pathlib import Path
from typing import Dict

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

FEATURE_COLUMNS = [
    "amount",
    "avg_amount_24h",
    "amount_delta_ratio",
    "velocity_1h",
    "velocity_24h",
    "location_deviation_km",
    "device_mismatch",
    "known_device_session",
    "hour_of_day",
]


def generate_synthetic_dataset(size: int = 5000) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    fraud_ratio = 0.025
    fraud_count = int(size * fraud_ratio)
    legit_count = size - fraud_count

    legit = pd.DataFrame(
        {
            "amount": rng.normal(2800, 1800, legit_count).clip(50, 25000),
            "avg_amount_24h": rng.normal(2500, 1200, legit_count).clip(50, 20000),
            "velocity_1h": rng.integers(0, 4, legit_count),
            "velocity_24h": rng.integers(1, 15, legit_count),
            "location_deviation_km": rng.normal(8, 12, legit_count).clip(0, 80),
            "device_mismatch": rng.binomial(1, 0.05, legit_count),
            "known_device_session": rng.binomial(1, 0.88, legit_count),
            "hour_of_day": rng.integers(6, 23, legit_count),
            "label": np.zeros(legit_count, dtype=int),
        }
    )

    fraud = pd.DataFrame(
        {
            "amount": rng.normal(76000, 25000, fraud_count).clip(5000, 220000),
            "avg_amount_24h": rng.normal(3200, 1700, fraud_count).clip(100, 30000),
            "velocity_1h": rng.integers(4, 12, fraud_count),
            "velocity_24h": rng.integers(9, 30, fraud_count),
            "location_deviation_km": rng.normal(1600, 850, fraud_count).clip(100, 8000),
            "device_mismatch": np.ones(fraud_count, dtype=int),
            "known_device_session": np.zeros(fraud_count, dtype=int),
            "hour_of_day": rng.integers(0, 5, fraud_count),
            "label": np.ones(fraud_count, dtype=int),
        }
    )

    dataset = pd.concat([legit, fraud], ignore_index=True)
    dataset["amount_delta_ratio"] = (
        dataset["amount"] / dataset["avg_amount_24h"].clip(lower=1)
    ).round(2)
    return dataset.sample(frac=1.0, random_state=42).reset_index(drop=True)


def train_and_save(model_path: Path, metrics_path: Path, data_path: Path) -> Dict:
    dataset = generate_synthetic_dataset()
    data_path.parent.mkdir(parents=True, exist_ok=True)
    dataset.head(1000).to_csv(data_path, index=False)

    X = dataset[FEATURE_COLUMNS]
    y = dataset["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    legit_mask = y_train == 0
    anomaly_model = IsolationForest(
        n_estimators=200,
        contamination=0.04,
        random_state=42,
    )
    anomaly_model.fit(X_train_scaled[legit_mask])

    train_scores = -anomaly_model.decision_function(X_train_scaled)
    test_scores = -anomaly_model.decision_function(X_test_scaled)

    X_cal_train = np.column_stack([X_train_scaled, train_scores])
    X_cal_test = np.column_stack([X_test_scaled, test_scores])

    smote = SMOTE(random_state=42)
    X_balanced, y_balanced = smote.fit_resample(X_cal_train, y_train)

    calibrator = LogisticRegression(max_iter=500, class_weight="balanced")
    calibrator.fit(X_balanced, y_balanced)

    probabilities = calibrator.predict_proba(X_cal_test)[:, 1]
    predictions = (probabilities >= 0.38).astype(int)

    metrics = {
        "precision": round(float(precision_score(y_test, predictions, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, predictions, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, predictions, zero_division=0)), 4),
        "threshold": 0.38,
        "rows": int(len(dataset)),
        "fraud_rate": round(float(dataset["label"].mean()), 4),
    }

    artifact = {
        "scaler": scaler,
        "anomaly_model": anomaly_model,
        "calibrator": calibrator,
        "features": FEATURE_COLUMNS,
    }

    model_path.parent.mkdir(parents=True, exist_ok=True)
    metrics_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, model_path)
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


def load_artifact(model_path: Path) -> Dict:
    return joblib.load(model_path)
