from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.project import Project
from app.models.acquisition_case import AcquisitionCase
from app.models.parcel import Parcel
from app.models.compensation import Compensation
from app.models.task import DepartmentalTask
from app.models.grievance import Grievance
from app.schemas.dashboard import (
    DashboardSummaryResponse, DashboardKPIs, RiskBreakdown,
    DelayCause, MonthlyProgress, DepartmentBottleneck, CompensationStageItem
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    cases = db.query(AcquisitionCase).all()
    total_cases = len(cases)
    
    parcels = db.query(Parcel).all()
    total_parcels = len(parcels)
    total_land_area = sum(float(p.area_acres) for p in parcels)
    acquired_area = sum(float(p.area_acres) for p in parcels if p.acquisition_status in ["Possession", "Compensation"])
    acquired_pct = (acquired_area / max(total_land_area, 1.0)) * 100.0

    low_risk = sum(1 for c in cases if c.current_risk_level == "Low")
    med_risk = sum(1 for c in cases if c.current_risk_level == "Medium")
    high_risk = sum(1 for c in cases if c.current_risk_level == "High")

    pending_surveys = sum(1 for p in parcels if p.survey_status in ["Pending", "In Progress"])
    ownership_disputes = sum(int(c.ownership_disputes_count or 0) for c in cases)
    
    compensations = db.query(Compensation).all()
    pending_comp_cr = sum(float(c.total_award_inr or 0.0) for c in compensations if c.stage_index < 9) / 10000000.0

    tasks = db.query(DepartmentalTask).all()
    overdue_tasks = sum(1 for t in tasks if t.status == "Overdue" or (t.is_overdue and t.status != "Completed"))

    grievances = db.query(Grievance).all()
    open_grievances = sum(1 for g in grievances if g.status != "Resolved")

    kpis = DashboardKPIs(
        total_projects=total_projects,
        total_cases=total_cases,
        total_parcels=total_parcels,
        total_land_area_acres=round(total_land_area, 1),
        acquired_area_acres=round(acquired_area, 1),
        acquired_percentage=round(acquired_pct, 1),
        risk_breakdown=RiskBreakdown(low_risk=low_risk, medium_risk=med_risk, high_risk=high_risk),
        pending_surveys=pending_surveys,
        ownership_disputes=ownership_disputes,
        pending_compensation_crores=round(pending_comp_cr, 2),
        overdue_tasks=overdue_tasks,
        open_grievances=open_grievances
    )

    delay_causes = [
        DelayCause(cause="Ownership Disputes / Title Contests", percentage=34.0),
        DelayCause(cause="Missing / Mismatched RoR Records", percentage=26.0),
        DelayCause(cause="Pending Joint Cadastral Survey", percentage=18.0),
        DelayCause(cause="Compensation Sanction Delays", percentage=12.0),
        DelayCause(cause="Inter-departmental Approvals", percentage=10.0)
    ]

    monthly_progress = [
        MonthlyProgress(month="Jan 2026", target_acres=40.0, achieved_acres=32.0),
        MonthlyProgress(month="Feb 2026", target_acres=55.0, achieved_acres=48.0),
        MonthlyProgress(month="Mar 2026", target_acres=60.0, achieved_acres=52.0),
        MonthlyProgress(month="Apr 2026", target_acres=50.0, achieved_acres=41.0),
        MonthlyProgress(month="May 2026", target_acres=70.0, achieved_acres=58.0),
        MonthlyProgress(month="Jun 2026", target_acres=65.0, achieved_acres=34.0)
    ]

    department_bottlenecks = [
        DepartmentBottleneck(department="Revenue Department", pending_tasks=12, overdue_tasks=4, avg_response_days=18.5),
        DepartmentBottleneck(department="Survey & Cadastral Directorate", pending_tasks=8, overdue_tasks=2, avg_response_days=14.2),
        DepartmentBottleneck(department="Compensation & Accounts Cell", pending_tasks=6, overdue_tasks=1, avg_response_days=9.8),
        DepartmentBottleneck(department="Forest & Environment Cell", pending_tasks=4, overdue_tasks=0, avg_response_days=24.0)
    ]

    compensation_stages = [
        CompensationStageItem(stage="Valuation Pending", count=8, amount_cr=4.2),
        CompensationStageItem(stage="Valuation Completed", count=6, amount_cr=3.8),
        CompensationStageItem(stage="Approval Pending", count=5, amount_cr=5.1),
        CompensationStageItem(stage="Bank Verification", count=9, amount_cr=7.3),
        CompensationStageItem(stage="Payment Disbursed", count=56, amount_cr=42.6)
    ]

    return DashboardSummaryResponse(
        kpis=kpis,
        delay_causes=delay_causes,
        monthly_progress=monthly_progress,
        department_bottlenecks=department_bottlenecks,
        compensation_stages=compensation_stages
    )

@router.get("/audit-logs")
def get_system_audit_logs(db: Session = Depends(get_db)):
    from app.models.activity_log import ActivityLog
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(100).all()
    if not logs:
        # Pre-seeded system audit history baseline
        return [
            {
                "id": 1,
                "timestamp": "2026-09-16 10:30:00",
                "category": "Risk Engine",
                "action": "Live Risk Recalculations Triggered",
                "entity_type": "AcquisitionCase",
                "entity_id": 4,
                "officer": "BhoomiSetu AI System",
                "details": "AI Engine calculated 84% delay risk due to title dispute & pending joint survey.",
                "ip_address": "127.0.0.1"
            },
            {
                "id": 2,
                "timestamp": "2026-09-15 14:15:00",
                "category": "Notices",
                "action": "Section 15 Objections Notice Drafted",
                "entity_type": "Notice",
                "entity_id": 402,
                "officer": "Shri Ashok Patra (LAO)",
                "details": "Notice NOTICE-OD-2026-402 created for Mouza Pipili.",
                "ip_address": "10.0.4.12"
            },
            {
                "id": 3,
                "timestamp": "2026-09-14 16:00:00",
                "category": "Claims",
                "action": "Landowner Claim Submitted",
                "entity_type": "Claim",
                "entity_id": 88,
                "officer": "Bikram Keshari Das",
                "details": "Objection filed regarding commercial tree valuation on Plot 142.",
                "ip_address": "192.168.1.45"
            },
            {
                "id": 4,
                "timestamp": "2026-09-12 11:20:00",
                "category": "OCR Verification",
                "action": "RoR Record OCR Scan Flagged Mismatch",
                "entity_type": "Document",
                "entity_id": 1,
                "officer": "RapidFuzz OCR Engine",
                "details": "Extracted Plot #142 mismatches official cadastral plot #142/A.",
                "ip_address": "127.0.0.1"
            },
            {
                "id": 5,
                "timestamp": "2026-09-10 09:00:00",
                "category": "Initiation",
                "action": "Acquisition Case Initialized",
                "entity_type": "AcquisitionCase",
                "entity_id": 4,
                "officer": "Shri Ashok Patra (LAO)",
                "details": "Case initialized under Section 4(1) for Bhubaneswar-Puri Expressway Corridor.",
                "ip_address": "10.0.4.12"
            }
        ]
    
    return [
        {
            "id": l.id,
            "timestamp": l.created_at.strftime("%Y-%m-%d %H:%M:%S") if l.created_at else "2026-09-16 10:30:00",
            "category": l.entity_type or "General",
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "officer": f"Officer (ID: {l.user_id})" if l.user_id else "System",
            "details": l.details or "",
            "ip_address": l.ip_address or "127.0.0.1"
        } for l in logs
    ]

@router.get("/comparative")
def get_comparative_analytics(db: Session = Depends(get_db)):
    """Comparative Analytics across Projects & Districts"""
    return {
        "district_comparison": [
            {"district": "Khurda (Bhubaneswar)", "high_risk_cases": 8, "medium_risk_cases": 12, "low_risk_cases": 24, "avg_delay_days": 112},
            {"district": "Puri Corridor", "high_risk_cases": 14, "medium_risk_cases": 9, "low_risk_cases": 18, "avg_delay_days": 145},
            {"district": "Cuttack Industrial Belt", "high_risk_cases": 5, "medium_risk_cases": 15, "low_risk_cases": 30, "avg_delay_days": 78},
            {"district": "Ganjam National Highway", "high_risk_cases": 3, "medium_risk_cases": 8, "low_risk_cases": 22, "avg_delay_days": 54}
        ],
        "project_type_comparison": [
            {"type": "Expressway / Highways", "avg_delay_prob": 0.68, "avg_dispute_count": 2.8, "completion_pct": 52.0},
            {"type": "Railway Expansion", "avg_delay_prob": 0.54, "avg_dispute_count": 1.9, "completion_pct": 64.0},
            {"type": "Industrial Parks", "avg_delay_prob": 0.42, "avg_dispute_count": 1.2, "completion_pct": 78.0},
            {"type": "Irrigation & Dams", "avg_delay_prob": 0.76, "avg_dispute_count": 3.4, "completion_pct": 41.0}
        ]
    }

