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

class StageForecast(BaseModel):
    stage_id: int
    stage_name: str
    predicted_delay_days: int
    risk_contribution_pct: float
    primary_blocker: str
    status: str # On-Track, Delayed, Critical Blocked

class PredictionResponse(BaseModel):
    case_id: int
    case_number: Optional[str] = None
    project_name: Optional[str] = None
    village_name: Optional[str] = None
    delay_probability: float
    risk_level: str
    predicted_delay_days: int
    urgency_level: Optional[str] = "Normal"
    model_version: str
    prediction_time: datetime
    contributing_factors: List[ContributingFactor] = []
    recommended_actions: List[RecommendedAction] = []
    stage_forecasts: List[StageForecast] = []
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

class RouteSimulationPredictRequest(BaseModel):
    total_parcels: int
    total_landowners: Optional[int] = 1
    total_land_area: float
    missing_doc_pct: float
    survey_completed_pct: float
    ownership_disputes_count: int
    court_cases_count: Optional[int] = 0
    pending_approvals_count: Optional[int] = 0
    compensation_progress_pct: float
    bank_verification_pct: Optional[float] = 100.0
    open_grievances_count: Optional[int] = 0
    avg_dept_response_days: Optional[float] = 14.0
    environmental_clearance: Optional[bool] = True
    rehabilitation_required: Optional[bool] = False
    district_delay_rate: Optional[float] = 35.0
    overdue_tasks_count: Optional[int] = 0
    days_remaining: Optional[int] = 90

class SimulationPredictionResponse(BaseModel):
    delay_probability: float
    risk_level: str
    predicted_delay_days: int
    model_version: str
    prediction_time: datetime
    contributing_factors: List[ContributingFactor] = []
    recommended_actions: List[RecommendedAction] = []
    disclaimer: str = "This prediction is decision-support information and must be reviewed by an authorised officer. It is not an automated legal decision."

class GlobalExplainabilityResponse(BaseModel):
    model_name: str
    version: str
    feature_importances: Dict[str, float]
    total_features_evaluated: int
    updated_at: str

class ModelGovernanceResponse(BaseModel):
    model_name: str
    version: str
    status: str
    test_accuracy: float
    test_precision: float
    test_recall: float
    test_f1_score: float
    test_roc_auc: float
    training_timestamp: str
    sample_size: int

