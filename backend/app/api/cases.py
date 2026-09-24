from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import re
from app.database import get_db
from app.models.acquisition_case import AcquisitionCase
from app.models.project import Project
from app.models.village import Village
from app.models.parcel import Parcel
from app.models.user import User
from app.schemas.acquisition_case import CaseResponse, CaseCreate, CaseStageUpdate, RiskSummary, CaseMetrics
from app.dependencies import get_current_user, require_roles
from app.services.risk_recalculation_service import RiskRecalculationService

router = APIRouter(prefix="/cases", tags=["Acquisition Cases"])

@router.get("", response_model=List[CaseResponse])
def list_cases(
    project_id: Optional[int] = None,
    village_id: Optional[int] = None,
    risk_level: Optional[str] = None,
    stage: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AcquisitionCase)
    if project_id:
        query = query.filter(AcquisitionCase.project_id == project_id)
    if village_id:
        query = query.filter(AcquisitionCase.village_id == village_id)
    if risk_level:
        query = query.filter(AcquisitionCase.current_risk_level == risk_level)
    if stage:
        query = query.filter(AcquisitionCase.current_stage == stage)
    if search:
        query = query.filter(
            (AcquisitionCase.case_number.ilike(f"%{search}%")) |
            (AcquisitionCase.plot_number.ilike(f"%{search}%")) |
            (AcquisitionCase.parcels.any(Parcel.plot_number.ilike(f"%{search}%")))
        )

    cases = query.all()
    results = []

    for c in cases:
        parcels = db.query(Parcel).filter(Parcel.case_id == c.id).all()
        parcels_count = len(parcels)
        total_area = sum(float(p.area_acres) for p in parcels)
        total_comp = sum(float(p.total_valuation_inr or 0.0) for p in parcels) / 10000000.0
        plot_num = c.plot_number or (parcels[0].plot_number if parcels else None)

        results.append(CaseResponse(
            id=c.id,
            case_number=c.case_number,
            plot_number=plot_num,
            project_id=c.project_id,
            project_name=c.project.name if c.project else None,
            village_id=c.village_id,
            village_name=c.village.name if c.village else None,
            district=c.village.district if c.village else None,
            notification_section=c.notification_section,
            current_stage=c.current_stage,
            status=c.status,
            assigned_officer_id=c.assigned_officer_id,
            assigned_officer_name=c.assigned_officer.full_name if c.assigned_officer else None,
            target_deadline=c.target_deadline,
            parcels_count=parcels_count,
            total_area_acres=round(total_area, 2),
            total_compensation_cr=round(total_comp, 2),
            risk_summary=RiskSummary(
                delay_probability=float(c.current_delay_probability or 0.0),
                risk_level=c.current_risk_level or "Low",
                predicted_delay_days=int(c.predicted_delay_days or 0),
                last_prediction_date=c.updated_at
            ),
            metrics=CaseMetrics(
                missing_doc_pct=float(c.missing_doc_pct or 0.0),
                survey_completed_pct=float(c.survey_completed_pct or 0.0),
                ownership_disputes_count=int(c.ownership_disputes_count or 0),
                court_cases_count=int(c.court_cases_count or 0),
                pending_approvals_count=int(c.pending_approvals_count or 0),
                compensation_progress_pct=float(c.compensation_progress_pct or 0.0),
                bank_verification_pct=float(c.bank_verification_pct or 0.0),
                environmental_clearance=bool(c.environmental_clearance),
                rehabilitation_required=bool(c.rehabilitation_required),
                open_grievances_count=len(c.grievances),
                overdue_tasks_count=sum(1 for t in c.tasks if t.status == "Overdue" or (t.is_overdue and t.status != "Completed"))
            ),
            created_at=c.created_at
        ))
    return results

@router.get("/{id}", response_model=CaseResponse)
def get_case(id: int, db: Session = Depends(get_db)):
    c = db.query(AcquisitionCase).filter(AcquisitionCase.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Acquisition case not found")

    parcels = db.query(Parcel).filter(Parcel.case_id == c.id).all()
    parcels_count = len(parcels)
    total_area = sum(float(p.area_acres) for p in parcels)
    total_comp = sum(float(p.total_valuation_inr or 0.0) for p in parcels) / 10000000.0
    plot_num = c.plot_number or (parcels[0].plot_number if parcels else None)

    return CaseResponse(
        id=c.id,
        case_number=c.case_number,
        plot_number=plot_num,
        project_id=c.project_id,
        project_name=c.project.name if c.project else None,
        village_id=c.village_id,
        village_name=c.village.name if c.village else None,
        district=c.village.district if c.village else None,
        notification_section=c.notification_section,
        current_stage=c.current_stage,
        status=c.status,
        assigned_officer_id=c.assigned_officer_id,
        assigned_officer_name=c.assigned_officer.full_name if c.assigned_officer else None,
        target_deadline=c.target_deadline,
        parcels_count=parcels_count,
        total_area_acres=round(total_area, 2),
        total_compensation_cr=round(total_comp, 2),
        risk_summary=RiskSummary(
            delay_probability=float(c.current_delay_probability or 0.0),
            risk_level=c.current_risk_level or "Low",
            predicted_delay_days=int(c.predicted_delay_days or 0),
            last_prediction_date=c.updated_at
        ),
        metrics=CaseMetrics(
            missing_doc_pct=float(c.missing_doc_pct or 0.0),
            survey_completed_pct=float(c.survey_completed_pct or 0.0),
            ownership_disputes_count=int(c.ownership_disputes_count or 0),
            court_cases_count=int(c.court_cases_count or 0),
            pending_approvals_count=int(c.pending_approvals_count or 0),
            compensation_progress_pct=float(c.compensation_progress_pct or 0.0),
            bank_verification_pct=float(c.bank_verification_pct or 0.0),
            environmental_clearance=bool(c.environmental_clearance),
            rehabilitation_required=bool(c.rehabilitation_required),
            open_grievances_count=len(c.grievances),
            overdue_tasks_count=sum(1 for t in c.tasks if t.status == "Overdue" or (t.is_overdue and t.status != "Completed"))
        ),
        created_at=c.created_at
    )

@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(
    payload: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "land_acquisition_officer"]))
):
    existing = db.query(AcquisitionCase).filter(AcquisitionCase.case_number == payload.case_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Case number already exists")

    # Validate plot_number according to project conventions
    clean_plot = None
    if payload.plot_number is not None:
        clean_plot = str(payload.plot_number).strip()
        if clean_plot:
            if not re.match(r"^[0-9A-Za-z/_\-]+$", clean_plot):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid plot number format. Only alphanumeric characters, slashes (/), dashes (-), and underscores (_) are allowed (e.g., 142/A)."
                )
            if len(clean_plot) > 40:
                raise HTTPException(status_code=400, detail="Plot number cannot exceed 40 characters.")
        else:
            clean_plot = None

    new_case = AcquisitionCase(
        case_number=payload.case_number,
        plot_number=clean_plot,
        project_id=payload.project_id,
        village_id=payload.village_id,
        notification_section=payload.notification_section or "4(1)",
        current_stage=payload.current_stage or "Notification",
        assigned_officer_id=payload.assigned_officer_id or current_user.id,
        target_deadline=payload.target_deadline,
        status="In Progress",
        current_delay_probability=0.25,
        current_risk_level="Low",
        predicted_delay_days=15
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    # If plot_number is provided, create initial parcel record for this case
    if clean_plot:
        initial_parcel = Parcel(
            case_id=new_case.id,
            village_id=new_case.village_id,
            plot_number=clean_plot,
            khata_number="101",
            area_acres=1.5,
            land_type="Agricultural",
            valuation_per_acre_inr=1000000.0,
            total_valuation_inr=1500000.0,
            survey_status="Pending",
            acquisition_status=new_case.current_stage or "Notification"
        )
        db.add(initial_parcel)
        db.commit()
        db.refresh(new_case)

    # Initial recalculation
    RiskRecalculationService.recalculate_case_risk(db, new_case.id, trigger_reason="Initial Case Creation")

    return get_case(new_case.id, db)

@router.put("/{id}", response_model=CaseResponse)
def update_case_stage(
    id: int,
    payload: CaseStageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "land_acquisition_officer"]))
):
    case = db.query(AcquisitionCase).filter(AcquisitionCase.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Acquisition case not found")

    case.current_stage = payload.current_stage
    case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(case)

    # Recalculate case risk on stage advancement
    RiskRecalculationService.recalculate_case_risk(db, case.id, trigger_reason=f"Case Stage Advanced to '{case.current_stage}'")

    return get_case(case.id, db)

