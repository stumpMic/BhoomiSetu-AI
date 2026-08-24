from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertResponse(BaseModel):
    id: int
    title: str
    message: str
    alert_type: str
    severity: str
    case_id: Optional[int] = None
    parcel_id: Optional[int] = None
    target_user_id: Optional[int] = None
    target_role: Optional[str] = None
    is_read: bool = False
    mock_sms_dispatched: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
