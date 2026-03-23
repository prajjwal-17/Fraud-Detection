from __future__ import annotations

from fastapi import FastAPI

from .model import DATA_PATH, METRICS_PATH, MODEL_PATH, ensure_model, score_payload
from .schemas import PredictRequest, PredictResponse
from .training import train_and_save

app = FastAPI(title="Fraud Detection ML Service", version="1.0.0")


@app.on_event("startup")
def warm_model():
    ensure_model()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    features = {
        "amount": payload.transaction.amount,
        **payload.behavior_features.model_dump(),
    }
    result = score_payload(features)
    return {
        "fraud_probability": result["fraud_probability"],
        "anomaly_score": result["anomaly_score"],
        "top_factors": result["top_factors"],
    }


@app.post("/train")
def train():
    metrics = train_and_save(MODEL_PATH, METRICS_PATH, DATA_PATH)
    ensure_model(force_reload=True)
    return {"message": "Model retrained", "metrics": metrics}
