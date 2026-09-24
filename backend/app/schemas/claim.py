from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ClaimBase(BaseModel):
    case_id: Optional[int] = None
    parcel_id: Optional[int] = None
    landowner_id: Optional[int] = None
    claim_number: str
    claim_type: str = "Compensation Claim"
    claimed_amount_inr: Optional[float] = 0.0
    description: str

class ClaimCreate(ClaimBase):
    pass

class ClaimDecisionRequest(BaseModel):
    status: str # Approved, Rejected, Revision Requested
    officer_decision_notes: Optional[str] = None

class ClaimResponse(ClaimBase):
    id: int
    case_number: Optional[str] = None
    plot_number: Optional[str] = None
    landowner_name: Optional[str] = None
    status: str
    officer_decision_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
