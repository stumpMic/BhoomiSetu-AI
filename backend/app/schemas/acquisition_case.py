from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class CaseMetrics(BaseModel):
    missing_doc_pct: float
    survey_completed_pct: float
    ownership_disputes_count: int
    court_cases_count: int
    pending_approvals_count: int
    compensation_progress_pct: float
    bank_verification_pct: float
    environmental_clearance: bool = True
    rehabilitation_required: bool = False
    open_grievances_count: Optional[int] = 0
    overdue_tasks_count: Optional[int] = 0

class RiskSummary(BaseModel):
    delay_probability: float
    risk_level: str
    predicted_delay_days: int
    last_prediction_date: Optional[datetime] = None

class CaseResponse(BaseModel):
    id: int
    case_number: str
    project_id: int
    project_name: Optional[str] = None
    village_id: int
    village_name: Optional[str] = None
    district: Optional[str] = None
    notification_section: str
    current_stage: str
    status: str
    assigned_officer_id: Optional[int] = None
    assigned_officer_name: Optional[str] = None
    target_deadline: Optional[date] = None
    parcels_count: Optional[int] = 0
    total_area_acres: Optional[float] = 0.0
    total_compensation_cr: Optional[float] = 0.0
    risk_summary: RiskSummary
    metrics: CaseMetrics
    created_at: datetime

    class Config:
        from_attributes = True

class CaseCreate(BaseModel):
    case_number: str
    project_id: int
    village_id: int
    notification_section: Optional[str] = "4(1)"
    current_stage: Optional[str] = "Notification"
    assigned_officer_id: Optional[int] = None
    target_deadline: Optional[date] = None
