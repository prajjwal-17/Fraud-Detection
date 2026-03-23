from pydantic import BaseModel
from typing import List


class TransactionPayload(BaseModel):
    amount: float
    timestamp: str
    device_id: str
    location_city: str


class BehaviorFeatures(BaseModel):
    avg_amount_24h: float
    amount_delta_ratio: float
    velocity_1h: int
    velocity_24h: int
    location_deviation_km: float
    device_mismatch: int
    known_device_session: int
    hour_of_day: int


class PredictRequest(BaseModel):
    transaction: TransactionPayload
    behavior_features: BehaviorFeatures


class PredictResponse(BaseModel):
    fraud_probability: float
    anomaly_score: float
    top_factors: List[str]
