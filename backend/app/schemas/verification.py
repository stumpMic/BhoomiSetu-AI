from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class LandownerRegisterRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    password: str
    confirm_password: str
    address: str
    district: str
    state: str = "Odisha"
    
    # Land Verification Fields
    land_record_id: Optional[str] = None
    tahasil: str
    village: str
    plot_number: str
    khata_number: str
    doc_ref_number: Optional[str] = None
    otp_code: Optional[str] = None

class OfficerRegisterRequest(BaseModel):
    full_name: str
    official_email: str
    phone: str
    password: str
    confirm_password: str
    department: str
    designation: str
    district: str
    office_name: str
    officer_id: str
    office_code: str
    otp_code: Optional[str] = None

class OTPRequest(BaseModel):
    identifier: str # Email or mobile
    account_type: str = "Landowner" # Landowner or Officer

class OTPResponse(BaseModel):
    success: bool
    message: str
    demo_otp: Optional[str] = "123456" # For SIH prototype zero-friction evaluation
    expires_in_seconds: int = 300

class OTPVerifyRequest(BaseModel):
    identifier: str
    otp_code: str

class RegistrationResultResponse(BaseModel):
    success: bool
    user_id: int
    account_type: str
    verification_status: str # VERIFIED or PENDING_VERIFICATION or REJECTED
    message: str
    details: Optional[dict] = None

class PendingVerificationItemResponse(BaseModel):
    id: int # verification request id
    user_id: int
    request_type: str
    submitted_at: datetime
    status: str
    notes: Optional[str] = None
    document_path: Optional[str] = None
    
    # User / Officer / Landowner details
    full_name: str
    email: str
    phone: Optional[str] = None
    district: Optional[str] = None
    
    # Officer-specific fields
    officer_id: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    office_code: Optional[str] = None
    office_name: Optional[str] = None
    
    # Landowner-specific fields
    land_record_id: Optional[str] = None
    tahasil: Optional[str] = None
    village: Optional[str] = None
    plot_number: Optional[str] = None
    khata_number: Optional[str] = None

    class Config:
        from_attributes = True

class VerificationReviewActionRequest(BaseModel):
    action: str # APPROVE or REJECT
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None
