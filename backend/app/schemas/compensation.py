from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class StageTimelineItem(BaseModel):
    stage: str
    completed: bool
    updated_at: Optional[datetime] = None

class BankDetails(BaseModel):
    account_number_masked: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None
    verification_status: Optional[str] = None

class CompensationResponse(BaseModel):
    id: int
    parcel_id: int
    plot_number: str
    khata_number: str
    village_name: str
    landowner_id: int
    landowner_name: str
    land_area_acres: float
    base_valuation_inr: float
    solatium_100pct_inr: float
    total_award_inr: float
    landowner_share_amount_inr: float
    current_stage: str
    stage: Optional[str] = None
    stage_index: int
    stages_timeline: List[StageTimelineItem] = []
    bank_details: BankDetails
    mock_payment_ref: Optional[str] = None

    class Config:
        from_attributes = True

class CompensationStageUpdateRequest(BaseModel):
    stage_name: Optional[str] = None
    stage: Optional[str] = None
    remarks: Optional[str] = None

class PrerequisitesStatus(BaseModel):
    survey_completed: bool
    survey_pct: float
    docs_verified: bool
    missing_doc_pct: float
    disputes_resolved: bool
    ownership_disputes: int
    court_cases: int

class CompensationAIRisk(BaseModel):
    delay_probability: float
    risk_level: str
    urgency: str
    predicted_delay_days: int
    compensation_factors: List[str] = []
    recommendations: List[str] = []

class CompensationWorkQueueItem(BaseModel):
    id: int
    case_id: int
    case_number: str
    project_id: Optional[int] = None
    project_name: str
    village_name: str
    parcel_id: int
    plot_number: str
    khata_number: str
    land_area_acres: float
    landowner_id: int
    landowner_name: str
    landowner_phone: Optional[str] = None
    landowner_share_amount_inr: float
    total_award_inr: float
    base_valuation_inr: float
    solatium_100pct_inr: float
    current_stage: str
    stage_index: int
    work_status: str  # "Ready for Compensation" | "In Progress" | "Blocked" | "Completed"
    days_pending: int
    blockers: List[str] = []
    prerequisites_status: PrerequisitesStatus
    ai_risk: CompensationAIRisk
    bank_details: BankDetails
    mock_payment_ref: Optional[str] = None
    payment_disbursed_at: Optional[datetime] = None

class CompensationWorkQueueSummary(BaseModel):
    total_items: int
    ready_count: int
    in_progress_count: int
    blocked_count: int
    completed_count: int
    total_award_crores: float
    disbursed_crores: float
    items: List[CompensationWorkQueueItem]

class RequestActionPayload(BaseModel):
    case_id: int
    compensation_id: Optional[int] = None
    parcel_id: Optional[int] = None
    target_department: str
    action_type: str
    notes: str

class CompensationAssessmentUpdate(BaseModel):
    base_land_value_inr: Optional[float] = None
    solatium_100pct_inr: Optional[float] = None
    additional_interest_inr: Optional[float] = None
    total_award_inr: Optional[float] = None
    landowner_share_inr: Optional[float] = None
    remarks: Optional[str] = None
