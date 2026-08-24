from pydantic import BaseModel
from typing import List, Dict, Any

class RiskBreakdown(BaseModel):
    low_risk: int
    medium_risk: int
    high_risk: int

class DashboardKPIs(BaseModel):
    total_projects: int
    total_cases: int
    total_parcels: int
    total_land_area_acres: float
    acquired_area_acres: float
    acquired_percentage: float
    risk_breakdown: RiskBreakdown
    pending_surveys: int
    ownership_disputes: int
    pending_compensation_crores: float
    overdue_tasks: int
    open_grievances: int

class DelayCause(BaseModel):
    cause: str
    percentage: float

class MonthlyProgress(BaseModel):
    month: str
    target_acres: float
    achieved_acres: float

class DepartmentBottleneck(BaseModel):
    department: str
    pending_tasks: int
    overdue_tasks: int
    avg_response_days: float

class CompensationStageItem(BaseModel):
    stage: str
    count: int
    amount_cr: float

class DashboardSummaryResponse(BaseModel):
    kpis: DashboardKPIs
    delay_causes: List[DelayCause]
    monthly_progress: List[MonthlyProgress]
    department_bottlenecks: List[DepartmentBottleneck]
    compensation_stages: List[CompensationStageItem]
