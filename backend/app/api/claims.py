from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.claim import LandownerClaim
from app.models.acquisition_case import AcquisitionCase
from app.models.landowner import Landowner
from app.models.parcel import Parcel
from app.schemas.claim import ClaimResponse, ClaimCreate, ClaimDecisionRequest
from app.dependencies import get_current_user, require_roles
from app.services.notification_service import NotificationService
from app.services.risk_recalculation_service import RiskRecalculationService

router = APIRouter(prefix="/claims", tags=["Landowner Claims"])

def _format_claim_response(c: LandownerClaim) -> ClaimResponse:
    return ClaimResponse(
        id=c.id,
        case_id=c.case_id,
        case_number=c.case.case_number if c.case else None,
        parcel_id=c.parcel_id,
        plot_number=c.parcel.plot_number if c.parcel else None,
        landowner_id=c.landowner_id,
        landowner_name=c.landowner.full_name if c.landowner else None,
        claim_number=c.claim_number,
        claim_type=c.claim_type,
        claimed_amount_inr=float(c.claimed_amount_inr or 0.0),
        description=c.description,
        status=c.status,
        officer_decision_notes=c.officer_decision_notes,
        reviewed_at=c.reviewed_at,
        created_at=c.created_at
    )

@router.get("", response_model=List[ClaimResponse])
def list_claims(
    case_id: Optional[int] = None,
    landowner_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "compensation_officer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compensation Officer does not have permission to view or manage landowner claims."
        )
    query = db.query(LandownerClaim)
    if case_id:
        query = query.filter(LandownerClaim.case_id == case_id)
    if landowner_id:
        query = query.filter(LandownerClaim.landowner_id == landowner_id)
    if status_filter:
        query = query.filter(LandownerClaim.status == status_filter)

    claims = query.order_by(LandownerClaim.created_at.desc()).all()
    return [_format_claim_response(c) for c in claims]

@router.post("", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
def submit_claim(
    payload: ClaimCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role == "compensation_officer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compensation Officer does not have permission to submit or alter landowner claims."
        )
    case = db.query(AcquisitionCase).filter(AcquisitionCase.id == payload.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Acquisition case not found")

    claim = LandownerClaim(
        case_id=payload.case_id,
        parcel_id=payload.parcel_id,
        landowner_id=payload.landowner_id,
        claim_number=payload.claim_number,
        claim_type=payload.claim_type,
        claimed_amount_inr=payload.claimed_amount_inr or 0.0,
        description=payload.description,
        status="Under Review"
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    # Risk recalculation trigger
    RiskRecalculationService.recalculate_case_risk(db, claim.case_id, trigger_reason=f"New Claim '{claim.claim_number}' Filed")

    return _format_claim_response(claim)

@router.put("/{id}/decision", response_model=ClaimResponse)
def review_claim_decision(
    id: int,
    payload: ClaimDecisionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["admin", "land_acquisition_officer"]))
):
    c = db.query(LandownerClaim).filter(LandownerClaim.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Landowner claim not found")

    c.status = payload.status
    c.officer_decision_notes = payload.officer_decision_notes
    c.reviewed_at = datetime.utcnow()
    c.reviewed_by_id = current_user.id

    db.commit()
    db.refresh(c)

    # Dispatch notification alert
    NotificationService.create_alert(
        db=db,
        title=f"Claim Status Update: {c.claim_number}",
        message=f"Claim '{c.claim_number}' for Case {c.case.case_number if c.case else ''} marked as {c.status}. Notes: {c.officer_decision_notes or 'None'}",
        alert_type="compensation_updated",
        severity="info" if payload.status == "Approved" else "warning",
        case_id=c.case_id,
        parcel_id=c.parcel_id,
        target_role="landowner"
    )

    # Dynamic risk recalculation trigger
    RiskRecalculationService.recalculate_case_risk(db, c.case_id, trigger_reason=f"Claim {c.claim_number} Decision: {c.status}")

    return _format_claim_response(c)
