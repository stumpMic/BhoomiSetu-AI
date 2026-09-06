from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class NoticeBase(BaseModel):
    case_id: int
    notice_number: str
    notice_type: str = "Section 4(1) Preliminary Notification"
    title: str
    content_summary: str
    issuing_authority: str = "Land Acquisition Officer, Khurda District"
    publish_date: date
    status: str = "Draft"

class NoticeCreate(NoticeBase):
    pass

class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    content_summary: Optional[str] = None
    status: Optional[str] = None

class NoticeResponse(NoticeBase):
    id: int
    case_number: Optional[str] = None
    issued_at: Optional[datetime] = None
    recipients_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
