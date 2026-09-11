from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class HearingBase(BaseModel):
    case_id: int
    hearing_type: str = "Section 15 Objections Hearing"
    title: str
    hearing_date: date
    hearing_time: str = "10:30 AM"
    venue_or_mode: str = "Collectorate Conference Hall, Khurda"
    participants: Optional[str] = None
    purpose: Optional[str] = None
    status: str = "Scheduled"
    minutes_summary: Optional[str] = None

class HearingCreate(HearingBase):
    pass

class HearingUpdate(BaseModel):
    hearing_type: Optional[str] = None
    title: Optional[str] = None
    hearing_date: Optional[date] = None
    hearing_time: Optional[str] = None
    venue_or_mode: Optional[str] = None
    participants: Optional[str] = None
    purpose: Optional[str] = None
    status: Optional[str] = None
    minutes_summary: Optional[str] = None

class HearingResponse(HearingBase):
    id: int
    case_number: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
