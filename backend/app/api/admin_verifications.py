from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.verification_record import VerificationRequest
from app.schemas.verification import (
    PendingVerificationItemResponse,
    VerificationReviewActionRequest
)
from app.dependencies import get_current_user, require_roles
from app.services.verification_service import VerificationService

router = APIRouter(prefix="/admin/verifications", tags=["Admin Verifications"])

@router.get("/stats")
def get_verification_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """Returns verification summary metrics for the Admin Dashboard"""
    pending_officers = db.query(VerificationRequest).filter(
        VerificationRequest.status == "PENDING",
        VerificationRequest.request_type == "OFFICER"
    ).count()

    pending_landowners = db.query(VerificationRequest).filter(
        VerificationRequest.status == "PENDING",
        VerificationRequest.request_type == "LANDOWNER"
    ).count()

    total_approved = db.query(VerificationRequest).filter(
        VerificationRequest.status == "APPROVED"
    ).count()

    total_rejected = db.query(VerificationRequest).filter(
        VerificationRequest.status == "REJECTED"
    ).count()

    total_verified_users = db.query(User).filter(
        User.verification_status == "VERIFIED"
    ).count()

    return {
        "pending_officers": pending_officers,
        "pending_landowners": pending_landowners,
        "total_approved": total_approved,
        "total_rejected": total_rejected,
        "total_verified_users": total_verified_users
    }

@router.get("/pending", response_model=List[PendingVerificationItemResponse])
def get_pending_verifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """Fetches list of pending officer and landowner registration requests"""
    items = VerificationService.get_pending_verification_requests(db=db)
    return [PendingVerificationItemResponse(**item) for item in items]

@router.get("/all")
def get_all_verifications(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """Fetches all verification history with optional status filter"""
    query = db.query(VerificationRequest)
    if status_filter:
        query = query.filter(VerificationRequest.status == status_filter.upper())
    
    requests = query.order_by(VerificationRequest.submitted_at.desc()).all()
    results = []
    for r in requests:
        u = r.user
        results.append({
            "id": r.id,
            "user_id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "request_type": r.request_type,
            "status": r.status,
            "submitted_at": r.submitted_at,
            "reviewed_at": r.reviewed_at,
            "rejection_reason": r.rejection_reason,
            "notes": r.notes,
            "document_path": r.document_path,
            "officer_id": u.officer_profile.officer_id if u.officer_profile else None,
            "department": u.officer_profile.department if u.officer_profile else None,
            "office_code": u.officer_profile.office_code if u.officer_profile else None
        })
    return results

@router.put("/{request_id}/review")
def review_verification(
    request_id: int,
    action_data: VerificationReviewActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """Approves or rejects a verification request"""
    res = VerificationService.review_verification_request(
        db=db,
        request_id=request_id,
        admin_user=current_user,
        action=action_data.action,
        rejection_reason=action_data.rejection_reason,
        notes=action_data.notes
    )
    return res
