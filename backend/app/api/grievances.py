import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.grievance import Grievance, GrievanceUpdate
from app.models.landowner import Landowner
from app.models.user import User
from app.schemas.grievance import GrievanceResponse, GrievanceCreate, GrievanceStatusUpdate, GrievanceUpdateItem
from app.dependencies import get_current_user, require_roles
from app.services.notification_service import NotificationService
from app.services.risk_recalculation_service import RiskRecalculationService

router = APIRouter(prefix="/grievances", tags=["Grievance Redressal"])

def _format_grievance(g: Grievance) -> GrievanceResponse:
    lo_name = g.landowner.full_name if g.landowner else "Complainant"
    plot_num = g.parcel.plot_number if g.parcel else None
    case_num = g.case.case_number if g.case else None
    dept_name = g.assigned_department.name if g.assigned_department else None
    officer_name = g.assigned_officer.full_name if g.assigned_officer else None

    updates = [
        GrievanceUpdateItem(
            stage=u.stage,
            timestamp=u.created_at,
            remarks=u.remarks
        ) for u in g.updates
    ]

    return GrievanceResponse(
        id=g.id,
        grievance_number=g.grievance_number,
        case_id=g.case_id,
        case_number=case_num,
        parcel_id=g.parcel_id,
        plot_number=plot_num,
        landowner_id=g.landowner_id,
        landowner_name=lo_name,
        category=g.category,
        subject=g.subject,
        description=g.description,
        status=g.status,
        assigned_department_id=g.assigned_department_id,
        assigned_department_name=dept_name,
        assigned_officer_name=officer_name,
        resolution_notes=g.resolution_notes,
        submitted_at=g.created_at,
        updates=updates
    )

@router.get("", response_model=List[GrievanceResponse])
def list_grievances(
    status_filter: Optional[str] = None,
    landowner_id: Optional[int] = None,
    case_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Grievance)
    if status_filter:
        query = query.filter(Grievance.status == status_filter)
    if landowner_id:
        query = query.filter(Grievance.landowner_id == landowner_id)
    if case_id:
        query = query.filter(Grievance.case_id == case_id)

    grievances = query.order_by(Grievance.created_at.desc()).all()
    return [_format_grievance(g) for g in grievances]

@router.get("/{id}", response_model=GrievanceResponse)
def get_grievance(id: int, db: Session = Depends(get_db)):
    g = db.query(Grievance).filter(Grievance.id == id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Grievance not found")
    return _format_grievance(g)

@router.post("", response_model=GrievanceResponse, status_code=status.HTTP_201_CREATED)
def submit_grievance(
    payload: GrievanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find landowner linked to user
    lo = db.query(Landowner).filter(Landowner.user_id == current_user.id).first()
    if not lo:
        lo = db.query(Landowner).filter(Landowner.id == 12).first() # Fallback to Bikram Das for demo

    grv_number = f"GRV-OD-2026-{uuid.uuid4().hex[:4].upper()}"

    g = Grievance(
        grievance_number=grv_number,
        case_id=payload.case_id or 4,
        parcel_id=payload.parcel_id,
        landowner_id=lo.id if lo else 12,
        category=payload.category,
        subject=payload.subject,
        description=payload.description,
        status="Submitted"
    )
    db.add(g)
    db.commit()
    db.refresh(g)

    # Add initial update log
    up = GrievanceUpdate(
        grievance_id=g.id,
        stage="Submitted",
        updated_by_user_id=current_user.id,
        remarks=f"Grievance submitted by {lo.full_name if lo else 'Landowner'}. Reference #{grv_number}."
    )
    db.add(up)
    db.commit()
    db.refresh(g)

    # Create alert
    NotificationService.create_alert(
        db=db,
        title=f"New Grievance Filed: {grv_number}",
        message=f"Landowner filed grievance under '{payload.category}': {payload.subject}",
        alert_type="grievance_filed",
        severity="warning",
        case_id=g.case_id,
        target_role="land_acquisition_officer"
    )

    if g.case_id:
        RiskRecalculationService.recalculate_case_risk(db, g.case_id, trigger_reason=f"New Grievance Filed #{grv_number}")

    return _format_grievance(g)

@router.put("/{id}/status", response_model=GrievanceResponse)
def update_grievance_status(
    id: int,
    payload: GrievanceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "land_acquisition_officer", "survey_officer", "compensation_officer"]))
):
    g = db.query(Grievance).filter(Grievance.id == id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Grievance not found")

    g.status = payload.status
    if payload.assigned_department_id:
        g.assigned_department_id = payload.assigned_department_id
    if payload.assigned_officer_id:
        g.assigned_officer_id = payload.assigned_officer_id
    if payload.remarks:
        g.resolution_notes = payload.remarks

    g.updated_at = datetime.utcnow()

    # Log update history
    up = GrievanceUpdate(
        grievance_id=g.id,
        stage=payload.status,
        updated_by_user_id=current_user.id,
        remarks=payload.remarks
    )
    db.add(up)
    db.commit()
    db.refresh(g)

    # Alert landowner
    NotificationService.create_alert(
        db=db,
        title=f"Grievance Status: {g.grievance_number}",
        message=f"Your grievance has been updated to '{payload.status}'. Remarks: {payload.remarks}",
        alert_type="grievance_resolved" if payload.status == "Resolved" else "grievance_filed",
        severity="success" if payload.status == "Resolved" else "info",
        case_id=g.case_id,
        target_role="landowner"
    )

    if g.case_id:
        RiskRecalculationService.recalculate_case_risk(db, g.case_id, trigger_reason=f"Grievance #{g.grievance_number} updated to {payload.status}")

    return _format_grievance(g)
