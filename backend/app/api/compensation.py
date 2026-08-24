from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.compensation import Compensation, CompensationStageLog
from app.models.parcel import Parcel
from app.models.landowner import Landowner
from app.models.user import User
from app.schemas.compensation import CompensationResponse, CompensationStageUpdateRequest, StageTimelineItem, BankDetails
from app.dependencies import get_current_user, require_roles
from app.services.notification_service import NotificationService
from app.services.risk_recalculation_service import RiskRecalculationService

router = APIRouter(prefix="/compensations", tags=["Compensation Tracker"])

STAGES_ORDER = [
    "Land valuation pending",
    "Valuation completed",
    "Compensation calculated",
    "Approval pending",
    "Compensation approved",
    "Landowner consent pending",
    "Bank verification",
    "Payment initiated",
    "Payment completed"
]

@router.get("", response_model=List[CompensationResponse])
def list_compensations(
    case_id: Optional[int] = None,
    stage: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Compensation)
    if case_id:
        query = query.filter(Compensation.case_id == case_id)
    if stage:
        query = query.filter(Compensation.current_stage == stage)

    comps = query.all()
    results = []

    for c in comps:
        p = c.parcel
        lo = c.landowner
        v = p.village if p else None

        timeline = []
        for idx, s in enumerate(STAGES_ORDER, 1):
            is_done = idx <= c.stage_index
            timeline.append(StageTimelineItem(
                stage=s,
                completed=is_done,
                updated_at=c.updated_at if is_done else None
            ))

        bank = BankDetails(
            account_number_masked=lo.bank_account_masked if lo else "XXXX-XXXX-1234",
            ifsc_code=lo.bank_ifsc if lo else "SBIN0001234",
            bank_name=lo.bank_name if lo else "State Bank of India",
            verification_status=lo.bank_verification_status if lo else "Pending"
        )

        results.append(CompensationResponse(
            id=c.id,
            parcel_id=c.parcel_id,
            plot_number=p.plot_number if p else "",
            khata_number=p.khata_number if p else "",
            village_name=v.name if v else "Pipili",
            landowner_id=c.landowner_id,
            landowner_name=lo.full_name if lo else "Beneficiary",
            land_area_acres=float(p.area_acres) if p else 1.0,
            base_valuation_inr=float(c.base_land_value_inr or 0.0),
            solatium_100pct_inr=float(c.solatium_100pct_inr or 0.0),
            total_award_inr=float(c.total_award_inr or 0.0),
            landowner_share_amount_inr=float(c.landowner_share_inr or 0.0),
            current_stage=c.current_stage,
            stage_index=c.stage_index,
            stages_timeline=timeline,
            bank_details=bank,
            mock_payment_ref=c.mock_payment_ref
        ))
    return results

@router.get("/{id}", response_model=CompensationResponse)
def get_compensation(id: int, db: Session = Depends(get_db)):
    c = db.query(Compensation).filter(Compensation.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Compensation record not found")

    p = c.parcel
    lo = c.landowner
    v = p.village if p else None

    timeline = []
    for idx, s in enumerate(STAGES_ORDER, 1):
        is_done = idx <= c.stage_index
        timeline.append(StageTimelineItem(
            stage=s,
            completed=is_done,
            updated_at=c.updated_at if is_done else None
        ))

    bank = BankDetails(
        account_number_masked=lo.bank_account_masked if lo else "XXXX-XXXX-1234",
        ifsc_code=lo.bank_ifsc if lo else "SBIN0001234",
        bank_name=lo.bank_name if lo else "State Bank of India",
        verification_status=lo.bank_verification_status if lo else "Pending"
    )

    return CompensationResponse(
        id=c.id,
        parcel_id=c.parcel_id,
        plot_number=p.plot_number if p else "",
        khata_number=p.khata_number if p else "",
        village_name=v.name if v else "Pipili",
        landowner_id=c.landowner_id,
        landowner_name=lo.full_name if lo else "Beneficiary",
        land_area_acres=float(p.area_acres) if p else 1.0,
        base_valuation_inr=float(c.base_land_value_inr or 0.0),
        solatium_100pct_inr=float(c.solatium_100pct_inr or 0.0),
        total_award_inr=float(c.total_award_inr or 0.0),
        landowner_share_amount_inr=float(c.landowner_share_inr or 0.0),
        current_stage=c.current_stage,
        stage_index=c.stage_index,
        stages_timeline=timeline,
        bank_details=bank,
        mock_payment_ref=c.mock_payment_ref
    )

@router.put("/{id}/stage")
def update_compensation_stage(
    id: int,
    payload: CompensationStageUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "compensation_officer", "land_acquisition_officer"]))
):
    c = db.query(Compensation).filter(Compensation.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Compensation record not found")

    new_stage = payload.stage_name
    new_idx = STAGES_ORDER.index(new_stage) + 1 if new_stage in STAGES_ORDER else c.stage_index + 1

    c.current_stage = new_stage
    c.stage_index = min(new_idx, 9)
    c.responsible_officer_id = current_user.id
    c.updated_at = datetime.utcnow()

    if new_idx == 9:
        c.payment_disbursed_at = datetime.utcnow()
        if not c.mock_payment_ref:
            c.mock_payment_ref = f"MOCK-PFMS-OD-2026-{c.id:06d}"

    # Record stage log
    log = CompensationStageLog(
        compensation_id=c.id,
        stage_name=new_stage,
        stage_index=c.stage_index,
        updated_by_user_id=current_user.id,
        remarks=payload.remarks or f"Stage progressed to {new_stage}"
    )
    db.add(log)
    db.commit()
    db.refresh(c)

    # Dispatch alert & SMS
    NotificationService.create_alert(
        db=db,
        title="Compensation Stage Updated",
        message=f"Compensation for Plot #{c.parcel.plot_number if c.parcel else ''} advanced to '{new_stage}'. Award Amount: ₹{float(c.landowner_share_inr)/100000:.2f} Lakhs.",
        alert_type="compensation_updated",
        severity="success",
        case_id=c.case_id,
        parcel_id=c.parcel_id,
        target_role="landowner"
    )

    # Dynamic risk recalculation
    RiskRecalculationService.recalculate_case_risk(db, c.case_id, trigger_reason=f"Compensation Stage Advanced to {new_stage}")

    return {
        "message": f"Compensation advanced to {new_stage}",
        "compensation_id": c.id,
        "current_stage": c.current_stage,
        "stage_index": c.stage_index
    }
