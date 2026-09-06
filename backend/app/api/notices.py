from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.notice import Notice
from app.models.acquisition_case import AcquisitionCase
from app.models.parcel import Parcel
from app.schemas.notice import NoticeResponse, NoticeCreate, NoticeUpdate
from app.dependencies import get_current_user, require_roles
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notices", tags=["Acquisition Notices"])

def _format_notice_response(n: Notice) -> NoticeResponse:
    return NoticeResponse(
        id=n.id,
        case_id=n.case_id,
        case_number=n.case.case_number if n.case else None,
        notice_number=n.notice_number,
        notice_type=n.notice_type,
        title=n.title,
        content_summary=n.content_summary,
        issuing_authority=n.issuing_authority,
        publish_date=n.publish_date,
        status=n.status,
        issued_at=n.issued_at,
        recipients_count=n.recipients_count or 0,
        created_at=n.created_at
    )

@router.get("", response_model=List[NoticeResponse])
def list_notices(
    case_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Notice)
    if case_id:
        query = query.filter(Notice.case_id == case_id)
    if status_filter:
        query = query.filter(Notice.status == status_filter)

    notices = query.order_by(Notice.created_at.desc()).all()
    return [_format_notice_response(n) for n in notices]

@router.post("", response_model=NoticeResponse, status_code=status.HTTP_201_CREATED)
def create_notice(
    payload: NoticeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["admin", "land_acquisition_officer"]))
):
    case = db.query(AcquisitionCase).filter(AcquisitionCase.id == payload.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Acquisition case not found")

    existing = db.query(Notice).filter(Notice.notice_number == payload.notice_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Notice number already exists")

    n = Notice(
        case_id=payload.case_id,
        notice_number=payload.notice_number,
        notice_type=payload.notice_type,
        title=payload.title,
        content_summary=payload.content_summary,
        issuing_authority=payload.issuing_authority,
        publish_date=payload.publish_date,
        status=payload.status or "Draft"
    )
    db.add(n)
    db.commit()
    db.refresh(n)

    return _format_notice_response(n)

@router.put("/{id}/publish", response_model=NoticeResponse)
def publish_notice(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["admin", "land_acquisition_officer"]))
):
    n = db.query(Notice).filter(Notice.id == id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notice not found")

    n.status = "Published"
    n.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(n)

    # Dispatch notification alert
    NotificationService.create_alert(
        db=db,
        title=f"Notice Published: {n.notice_number}",
        message=f"{n.notice_type} '{n.title}' published for Case {n.case.case_number if n.case else ''}.",
        alert_type="document_uploaded",
        severity="info",
        case_id=n.case_id,
        target_role="landowner"
    )

    return _format_notice_response(n)

@router.put("/{id}/send", response_model=NoticeResponse)
def send_notice_to_landowners(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["admin", "land_acquisition_officer"]))
):
    n = db.query(Notice).filter(Notice.id == id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notice not found")

    # Estimate recipients from case parcels co-sharers
    parcels = db.query(Parcel).filter(Parcel.case_id == n.case_id).all()
    total_landowners = 0
    for p in parcels:
        total_landowners += len(p.ownerships) if p.ownerships else 1

    n.status = "Sent/Issued"
    n.issued_at = datetime.utcnow()
    n.recipients_count = max(total_landowners, 1)
    n.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(n)

    # Dispatch alert with SMS simulation flag
    NotificationService.create_alert(
        db=db,
        title=f"Notice Dispatched to Landowners",
        message=f"{n.notice_type} ({n.notice_number}) issued to {n.recipients_count} landowner co-sharers via Mock SMS & Speed Post.",
        alert_type="compensation_updated",
        severity="success",
        case_id=n.case_id,
        target_role="landowner"
    )

    return _format_notice_response(n)
