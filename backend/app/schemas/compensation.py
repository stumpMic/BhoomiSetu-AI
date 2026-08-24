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
    stage_index: int
    stages_timeline: List[StageTimelineItem] = []
    bank_details: BankDetails
    mock_payment_ref: Optional[str] = None

    class Config:
        from_attributes = True

class CompensationStageUpdateRequest(BaseModel):
    stage_name: str
    remarks: Optional[str] = None
