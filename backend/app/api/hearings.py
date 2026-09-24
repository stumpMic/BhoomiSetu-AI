from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.hearing import Hearing
from app.models.acquisition_case import AcquisitionCase
from app.schemas.hearing import HearingResponse, HearingCreate, HearingUpdate
from app.dependencies import get_current_user, require_roles
from app.services.notification_service import NotificationService
from app.services.risk_recalculation_service import RiskRecalculationService

router = APIRouter(prefix="/hearings", tags=["Hearings & Meetings"])

def _format_hearing_response(h: Hearing) -> HearingResponse:
    return HearingResponse(
        id=h.id,
        case_id=h.case_id,
        case_number=h.case.case_number if h.case else None,
        hearing_type=h.hearing_type,
        title=h.title,
        hearing_date=h.hearing_date,
        hearing_time=h.hearing_time,
        venue_or_mode=h.venue_or_mode,
        participants=h.participants,
        purpose=h.purpose,
        status=h.status,
        minutes_summary=h.minutes_summary,
        created_at=h.created_at
    )

@router.get("", response_model=List[HearingResponse])
def list_hearings(
    case_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "compensation_officer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compensation Officer does not have permission to view or manage statutory hearings."
        )
    query = db.query(Hearing)
    if case_id:
        query = query.filter(Hearing.case_id == case_id)
    if status_filter:
        query = query.filter(Hearing.status == status_filter)

    hearings = query.order_by(Hearing.hearing_date.asc()).all()
    return [_format_hearing_response(h) for h in hearings]

@router.post("", response_model=HearingResponse, status_code=status.HTTP_201_CREATED)
def schedule_hearing(
    payload: HearingCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["admin", "land_acquisition_officer"]))
):
    case = db.query(AcquisitionCase).filter(AcquisitionCase.id == payload.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Acquisition case not found")

    h = Hearing(
        case_id=payload.case_id,
        hearing_type=payload.hearing_type,
        title=payload.title,
        hearing_date=payload.hearing_date,
        hearing_time=payload.hearing_time,
        venue_or_mode=payload.venue_or_mode,
        participants=payload.participants,
        purpose=payload.purpose,
        status=payload.status or "Scheduled",
        minutes_summary=payload.minutes_summary
    )
    db.add(h)
    db.commit()
    db.refresh(h)

    # Dispatch notification alert
    NotificationService.create_alert(
        db=db,
        title=f"Hearing Scheduled: {h.title}",
        message=f"{h.hearing_type} scheduled for Case {case.case_number} on {h.hearing_date} at {h.hearing_time} ({h.venue_or_mode}).",
        alert_type="deadline_warning",
        severity="info",
        case_id=h.case_id,
        target_role="land_acquisition_officer"
    )

    # Trigger case risk recalculation
    RiskRecalculationService.recalculate_case_risk(db, h.case_id, trigger_reason=f"Hearing '{h.title}' Scheduled")

    return _format_hearing_response(h)

@router.put("/{id}", response_model=HearingResponse)
def update_hearing(
    id: int,
    payload: HearingUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["admin", "land_acquisition_officer"]))
):
    h = db.query(Hearing).filter(Hearing.id == id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hearing not found")

    if payload.hearing_type:
        h.hearing_type = payload.hearing_type
    if payload.title:
        h.title = payload.title
    if payload.hearing_date:
        h.hearing_date = payload.hearing_date
    if payload.hearing_time:
        h.hearing_time = payload.hearing_time
    if payload.venue_or_mode:
        h.venue_or_mode = payload.venue_or_mode
    if payload.participants:
        h.participants = payload.participants
    if payload.purpose:
        h.purpose = payload.purpose
    if payload.status:
        h.status = payload.status
    if payload.minutes_summary:
        h.minutes_summary = payload.minutes_summary

    db.commit()
    db.refresh(h)

    return _format_hearing_response(h)
