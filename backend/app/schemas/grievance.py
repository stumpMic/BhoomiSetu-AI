from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class GrievanceUpdateItem(BaseModel):
    stage: str
    timestamp: datetime
    remarks: str

class GrievanceResponse(BaseModel):
    id: int
    grievance_number: str
    case_id: Optional[int] = None
    case_number: Optional[str] = None
    parcel_id: Optional[int] = None
    plot_number: Optional[str] = None
    landowner_id: int
    landowner_name: str
    category: str
    subject: str
    description: str
    status: str
    assigned_department_id: Optional[int] = None
    assigned_department_name: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    resolution_notes: Optional[str] = None
    submitted_at: datetime
    updates: List[GrievanceUpdateItem] = []

    class Config:
        from_attributes = True

class GrievanceCreate(BaseModel):
    case_id: Optional[int] = None
    parcel_id: Optional[int] = None
    category: str
    subject: str
    description: str

class GrievanceStatusUpdate(BaseModel):
    status: str
    remarks: str
    assigned_department_id: Optional[int] = None
    assigned_officer_id: Optional[int] = None
