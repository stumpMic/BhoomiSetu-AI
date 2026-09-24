from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[int] = None
    case_id: Optional[int] = None
    parcel_id: Optional[int] = None
    assigned_department_id: Optional[int] = None
    assigned_officer_id: Optional[int] = None
    priority: Optional[str] = "Medium"
    start_date: Optional[date] = None
    deadline: date
    remarks: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    status: Optional[str] = None # To do, In progress, Waiting for info, Completed, Overdue
    remarks: Optional[str] = None
    completion_evidence: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    project_name: Optional[str] = None
    case_number: Optional[str] = None
    plot_number: Optional[str] = None
    assigned_department_name: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    status: str
    is_overdue: bool = False
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
