from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class NoticeBase(BaseModel):
    case_id: Optional[int] = None
    notice_number: Optional[str] = None
    notice_type: str = "Official Gazette / Public Notice"
    title: str
    content_summary: str
    priority: str = "Normal" # Normal, Important, Urgent
    deadline: Optional[date] = None
    issuing_authority: str = "Land Acquisition Officer, Khurda District"
    publish_date: Optional[date] = None
    status: str = "Draft"

class NoticeCreate(NoticeBase):
    pass

class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    content_summary: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[date] = None
    status: Optional[str] = None
    case_id: Optional[int] = None
    notice_type: Optional[str] = None
    issuing_authority: Optional[str] = None
    is_active: Optional[bool] = None

class NoticeResponse(BaseModel):
    id: int
    case_id: Optional[int] = None
    case_number: Optional[str] = None
    notice_number: str
    notice_type: str
    title: str
    content_summary: str
    priority: str = "Normal"
    deadline: Optional[date] = None
    issuing_authority: str
    publish_date: date
    status: str
    is_active: bool = True
    issued_at: Optional[datetime] = None
    recipients_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

