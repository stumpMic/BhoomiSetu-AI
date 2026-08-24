from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class ProjectBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    executing_agency: Optional[str] = None
    state: Optional[str] = "Odisha"
    districts: Optional[str] = None
    target_start_date: Optional[date] = None
    target_end_date: Optional[date] = None
    estimated_budget_cr: Optional[float] = 0.0
    total_area_required_acres: Optional[float] = 0.0
    status: Optional[str] = "Active"

class ProjectCreate(ProjectBase):
    project_authority_id: Optional[int] = None

class ProjectResponse(ProjectBase):
    id: int
    project_authority_id: Optional[int] = None
    cases_count: Optional[int] = 0
    acquired_area_acres: Optional[float] = 0.0
    high_risk_cases_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True
