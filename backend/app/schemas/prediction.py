from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ContributingFactor(BaseModel):
    factor: str
    impact: float
    direction: str # increases_risk, decreases_risk
    description: str

class RecommendedAction(BaseModel):
    title: str
    department: str
    priority: str # High, Medium, Low
    description: str

class PredictionResponse(BaseModel):
    case_id: int
    case_number: Optional[str] = None
    project_name: Optional[str] = None
    village_name: Optional[str] = None
    delay_probability: float
    risk_level: str
    predicted_delay_days: int
    model_version: str
    prediction_time: datetime
    contributing_factors: List[ContributingFactor] = []
    recommended_actions: List[RecommendedAction] = []
    disclaimer: str = "This prediction is decision-support information and must be reviewed by an authorised officer. It is not an automated legal decision."

class PredictionHistoryItem(BaseModel):
    id: int
    delay_probability: float
    risk_level: str
    predicted_delay_days: int
    trigger_reason: str
    prediction_time: datetime

class PredictionHistoryResponse(BaseModel):
    case_id: int
    history: List[PredictionHistoryItem]
