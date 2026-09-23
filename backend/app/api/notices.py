from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
import random

from app.database import get_db
from app.models.notice import Notice
from app.models.acquisition_case import AcquisitionCase
from app.models.parcel import Parcel
from app.schemas.notice import NoticeResponse, NoticeCreate, NoticeUpdate
from app.dependencies import get_current_user, require_roles
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notices", tags=["Acquisition & Public Notices"])

def _format_notice_response(n: Notice) -> NoticeResponse:
    return NoticeResponse(
        id=n.id,
        case_id=n.case_id,
        case_number=n.case.case_number if n.case else None,
        notice_number=n.notice_number,
        notice_type=n.notice_type or "Official Gazette / Public Notice",
        title=n.title,
        content_summary=n.content_summary,
        priority=n.priority or "Normal",
        deadline=n.deadline,
        issuing_authority=n.issuing_authority or "Land Acquisition Officer, Khurda District",
        publish_date=n.publish_date or (n.created_at.date() if n.created_at else date.today()),
        status=n.status or "Draft",
        is_active=bool(n.is_active) if n.is_active is not None else True,
        issued_at=n.issued_at,
        recipients_count=n.recipients_count or 0,
        created_at=n.created_at or datetime.utcnow(),
        updated_at=n.updated_at
    )

@router.get("", response_model=List[NoticeResponse])
def list_notices(
    case_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, description="Filter by status (Draft, Published, Deactivated)"),
    priority: Optional[str] = Query(None, description="Filter by priority (Normal, Important, Urgent)"),
    active_only: bool = Query(False, description="Filter only active notices"),
    db: Session = Depends(get_db)
):
    """
    Public Notice Board list: accessible by all website visitors without login.
    Returns notices ordered by publish date and priority.
    """
    query = db.query(Notice)
    if case_id:
        query = query.filter(Notice.case_id == case_id)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Notice.status == status_filter)
    if priority and priority.upper() != "ALL":
        query = query.filter(Notice.priority == priority)
    if active_only:
        query = query.filter(Notice.is_active == True)

    notices = query.order_by(Notice.publish_date.desc(), Notice.id.desc()).all()
    return [_format_notice_response(n) for n in notices]

@router.post("", response_model=NoticeResponse, status_code=status.HTTP_201_CREATED)
def create_notice(
    payload: NoticeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["admin", "land_acquisition_officer"]))
):
    """
    LAO & Admin creates a new public or statutory notice.
    Survey Officer and Compensation Officer are restricted.
    """
    case = None
    if payload.case_id:
        case = db.query(AcquisitionCase).filter(AcquisitionCase.id == payload.case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Acquisition case not found")

    notice_num = payload.notice_number
    if not notice_num:
        notice_num = f"NOTICE-OD-2026-{random.randint(100, 999)}"

    existing = db.query(Notice).filter(Notice.notice_number == notice_num).first()
    if existing:
        raise HTTPException(status_code=400, detail="Notice number already exists")

    n = Notice(
        case_id=payload.case_id,
        notice_number=notice_num,
        notice_type=payload.notice_type or "Official Gazette / Public Notice",
        title=payload.title,
        content_summary=payload.content_summary,
        priority=payload.priority or "Normal",
        deadline=payload.deadline,
        issuing_authority=payload.issuing_authority or "Land Acquisition Officer, Khurda District",
        publish_date=payload.publish_date or date.today(),
        status=payload.status or "Draft",
        is_active=True
    )
    db.add(n)
    db.commit()
    db.refresh(n)

    return _format_notice_response(n)

@router.get("/{id}", response_model=NoticeResponse)
def get_notice(id: int, db: Session = Depends(get_db)):
    """Publicly view full details of a specific notice"""
    n = db.query(Notice).filter(Notice.id == id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notice not found")
    return _format_notice_response(n)

@router.put("/{id}", response_model=NoticeResponse)
def update_notice(
    id: int,
    payload: NoticeUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["admin", "land_acquisition_officer"]))
):
    """LAO edits an existing notice"""
    n = db.query(Notice).filter(Notice.id == id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notice not found")

    if payload.title is not None:
        n.title = payload.title
    if payload.content_summary is not None:
        n.content_summary = payload.content_summary
    if payload.priority is not None:
        n.priority = payload.priority
    if payload.deadline is not None:
        n.deadline = payload.deadline
    if payload.status is not None:
        n.status = payload.status
    if payload.case_id is not None:
        n.case_id = payload.case_id
    if payload.notice_type is not None:
        n.notice_type = payload.notice_type
    if payload.issuing_authority is not None:
        n.issuing_authority = payload.issuing_authority
    if payload.is_active is not None:
        n.is_active = payload.is_active

    n.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(n)

    return _format_notice_response(n)

@router.put("/{id}/publish", response_model=NoticeResponse)
def publish_notice(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["admin", "land_acquisition_officer"]))
):
    """LAO publishes notice, making it visible on Public Notice Board"""
    n = db.query(Notice).filter(Notice.id == id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notice not found")

    n.status = "Published"
    n.is_active = True
    n.publish_date = date.today()
    n.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(n)

    # Dispatch notification alert
    NotificationService.create_alert(
        db=db,
        title=f"Public Notice Published: {n.notice_number}",
        message=f"{n.priority} Notice '{n.title}' published by LAO for public viewing.",
        alert_type="document_uploaded",
        severity="warning" if n.priority in ["Urgent", "Important"] else "info",
        case_id=n.case_id,
        target_role="landowner"
    )

    return _format_notice_response(n)

@router.put("/{id}/deactivate", response_model=NoticeResponse)
def deactivate_notice(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["admin", "land_acquisition_officer"]))
):
    """LAO deactivates a notice so it is withdrawn from public visibility"""
    n = db.query(Notice).filter(Notice.id == id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notice not found")

    n.status = "Deactivated"
    n.is_active = False
    n.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(n)

    return _format_notice_response(n)

@router.delete("/{id}")
def delete_notice(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["admin", "land_acquisition_officer"]))
):
    """LAO deletes a notice"""
    n = db.query(Notice).filter(Notice.id == id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notice not found")

    db.delete(n)
    db.commit()
    return {"status": "SUCCESS", "message": f"Notice #{id} deleted successfully."}

@router.put("/{id}/send", response_model=NoticeResponse)
def send_notice_to_landowners(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["admin", "land_acquisition_officer"]))
):
    n = db.query(Notice).filter(Notice.id == id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notice not found")

    total_landowners = 14
    if n.case_id:
        parcels = db.query(Parcel).filter(Parcel.case_id == n.case_id).all()
        cnt = 0
        for p in parcels:
            cnt += len(p.ownerships) if p.ownerships else 1
        total_landowners = max(cnt, 1)

    n.status = "Sent/Issued"
    n.issued_at = datetime.utcnow()
    n.recipients_count = total_landowners
    n.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(n)

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
