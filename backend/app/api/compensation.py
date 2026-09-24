from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.compensation import Compensation, CompensationStageLog
from app.models.parcel import Parcel
from app.models.landowner import Landowner
from app.models.acquisition_case import AcquisitionCase
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.schemas.compensation import (
    CompensationResponse, CompensationStageUpdateRequest, StageTimelineItem, BankDetails,
    CompensationWorkQueueSummary, CompensationWorkQueueItem, PrerequisitesStatus,
    CompensationAIRisk, RequestActionPayload, CompensationAssessmentUpdate
)
from app.dependencies import get_current_user, require_roles, get_current_user_optional
from app.services.notification_service import NotificationService
from app.services.risk_recalculation_service import RiskRecalculationService

router = APIRouter(tags=["Compensation Tracker"])

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

@router.get("/compensations/work-queue", response_model=CompensationWorkQueueSummary)
@router.get("/compensation/work-queue", response_model=CompensationWorkQueueSummary)
@router.get("/work-queue", response_model=CompensationWorkQueueSummary)
def get_compensation_work_queue(
    case_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "compensation_officer"]))
):
    query = db.query(Compensation)
    if case_id:
        query = query.filter(Compensation.case_id == case_id)

    comps = query.all()
    today = datetime.utcnow().date()
    items = []

    ready_count = 0
    in_progress_count = 0
    blocked_count = 0
    completed_count = 0
    total_award_sum = 0.0
    disbursed_sum = 0.0

    for c in comps:
        case = c.case
        p = c.parcel
        lo = c.landowner
        v = p.village if p else (case.village if case else None)

        # 1. Prerequisites check from live case & landowner records
        survey_pct = float(case.survey_completed_pct or 0.0) if case else 0.0
        survey_ok = survey_pct >= 90.0

        missing_doc_pct = float(case.missing_doc_pct or 0.0) if case else 0.0
        docs_ok = missing_doc_pct <= 10.0

        disputes_count = int(case.ownership_disputes_count or 0) if case else 0
        disputes_ok = disputes_count == 0

        court_count = int(case.court_cases_count or 0) if case else 0
        court_ok = court_count == 0

        all_prereqs_met = survey_ok and docs_ok and disputes_ok and court_ok

        # 2. Determine work queue status bucket
        if c.stage_index >= 9 or c.current_stage == "Payment completed":
            work_status = "Completed"
            completed_count += 1
            disbursed_sum += float(c.total_award_inr or 0.0)
        elif c.stage_index > 1:
            work_status = "In Progress"
            in_progress_count += 1
        else:
            # Stage 1: Check prerequisites
            if all_prereqs_met:
                work_status = "Ready for Compensation"
                ready_count += 1
            else:
                work_status = "Blocked"
                blocked_count += 1

        total_award_sum += float(c.total_award_inr or 0.0)

        # 3. Compile specific blockers
        blockers = []
        if not survey_ok:
            blockers.append(f"Cadastral survey incomplete ({survey_pct:.0f}% completed; min 90% required)")
        if not docs_ok:
            blockers.append(f"Title / RoR document verification incomplete ({missing_doc_pct:.0f}% missing/unverified)")
        if not disputes_ok:
            blockers.append(f"{disputes_count} active ownership/title dispute(s) pending inquiry")
        if not court_ok:
            blockers.append(f"{court_count} court / tribunal dispute proceeding(s) active")
        if lo and lo.bank_verification_status != "Verified":
            blockers.append(f"Landowner bank account verification pending ({lo.bank_verification_status or 'Pending'})")

        # 4. Days pending calculation
        created_d = c.created_at.date() if c.created_at else today
        days_pending = max((today - created_d).days, 1)

        # 5. AI Risk & delay factors
        delay_prob = float(case.current_delay_probability or 0.25) if case else 0.25
        case_risk = case.current_risk_level or ("High" if delay_prob >= 0.7 else "Medium" if delay_prob >= 0.4 else "Low") if case else "Low"
        predicted_days = int(case.predicted_delay_days or 15) if case else 15
        urgency = "High" if case_risk == "High" or delay_prob >= 0.7 else "Medium" if case_risk == "Medium" else "Normal"

        comp_factors = []
        if not survey_ok:
            comp_factors.append(f"Joint survey demarcation delay ({survey_pct:.0f}%) impacting land boundary valuation")
        if not docs_ok or not disputes_ok:
            comp_factors.append("Title contestation & RoR mutation discrepancy under Sec 15 review")
        if lo and lo.bank_verification_status != "Verified":
            comp_factors.append("PFMS bank account verification mismatch risk")
        if c.stage_index in [3, 4]:
            comp_factors.append("Statutory 100% solatium award sanction pending Competent Authority review")
        if not comp_factors:
            comp_factors.append("Statutory processing timeline within permissible schedule")

        recs = []
        if not survey_ok:
            recs.append("Coordinate with Survey Directorate to expedite field sub-plot demarcation.")
        if not docs_ok or not disputes_ok:
            recs.append("Request Revenue Cell to finalize title verification inquiry.")
        if c.stage_index <= 2 and all_prereqs_met:
            recs.append("All prerequisites satisfied. Proceed with Section 23 valuation calculation.")
        elif c.stage_index == 4:
            recs.append("Submit finalized award determination for Section 30 sanction.")
        elif c.stage_index in [6, 7]:
            recs.append("Verify Aadhaar-seeded bank account for PFMS direct benefit transfer.")
        else:
            recs.append("Track disbursement status through State Treasury DBT gateway.")

        bank = BankDetails(
            account_number_masked=lo.bank_account_masked if lo else "XXXX-XXXX-1234",
            ifsc_code=lo.bank_ifsc if lo else "SBIN0001234",
            bank_name=lo.bank_name if lo else "State Bank of India",
            verification_status=lo.bank_verification_status if lo else "Pending"
        )

        item = CompensationWorkQueueItem(
            id=c.id,
            case_id=c.case_id,
            case_number=case.case_number if case else f"CASE-{c.case_id}",
            project_id=case.project_id if case else None,
            project_name=case.project.name if (case and case.project) else "Expressway Project",
            village_name=v.name if v else "Pipili",
            parcel_id=c.parcel_id,
            plot_number=p.plot_number if p else "",
            khata_number=p.khata_number if p else "",
            land_area_acres=float(p.area_acres) if p else 1.0,
            landowner_id=c.landowner_id,
            landowner_name=lo.full_name if lo else "Beneficiary",
            landowner_phone=lo.phone if lo else None,
            landowner_share_amount_inr=float(c.landowner_share_inr or 0.0),
            total_award_inr=float(c.total_award_inr or 0.0),
            base_valuation_inr=float(c.base_land_value_inr or 0.0),
            solatium_100pct_inr=float(c.solatium_100pct_inr or 0.0),
            current_stage=c.current_stage,
            stage_index=c.stage_index,
            work_status=work_status,
            days_pending=days_pending,
            blockers=blockers,
            prerequisites_status=PrerequisitesStatus(
                survey_completed=survey_ok,
                survey_pct=survey_pct,
                docs_verified=docs_ok,
                missing_doc_pct=missing_doc_pct,
                disputes_resolved=disputes_ok,
                ownership_disputes=disputes_count,
                court_cases=court_count
            ),
            ai_risk=CompensationAIRisk(
                delay_probability=delay_prob,
                risk_level=case_risk,
                urgency=urgency,
                predicted_delay_days=predicted_days,
                compensation_factors=comp_factors,
                recommendations=recs
            ),
            bank_details=bank,
            mock_payment_ref=c.mock_payment_ref,
            payment_disbursed_at=c.payment_disbursed_at
        )

        # Filters
        if status_filter and status_filter.lower() != "all" and item.work_status.lower() != status_filter.lower():
            continue
        if risk_level and risk_level.lower() != "all" and item.ai_risk.risk_level.lower() != risk_level.lower():
            continue

        items.append(item)

    return CompensationWorkQueueSummary(
        total_items=len(items),
        ready_count=ready_count,
        in_progress_count=in_progress_count,
        blocked_count=blocked_count,
        completed_count=completed_count,
        total_award_crores=round(total_award_sum / 10000000.0, 2),
        disbursed_crores=round(disbursed_sum / 10000000.0, 2),
        items=items
    )

@router.post("/compensations/request-action")
@router.post("/compensation/request-action")
@router.post("/request-action")
def request_interdepartmental_action(
    payload: RequestActionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "compensation_officer"]))
):
    case = db.query(AcquisitionCase).filter(AcquisitionCase.id == payload.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Acquisition case not found")

    target_role = "survey_officer" if "survey" in payload.target_department.lower() else "land_acquisition_officer"

    alert = NotificationService.create_alert(
        db=db,
        title=f"Compensation Cell Request: {payload.action_type}",
        message=f"Compensation Officer requested action from {payload.target_department} for Case {case.case_number}: {payload.notes}",
        alert_type="task_overdue",
        severity="warning",
        case_id=case.id,
        parcel_id=payload.parcel_id,
        target_role=target_role
    )

    log = ActivityLog(
        user_id=current_user.id,
        action=f"Requested Interdepartmental Action: {payload.action_type}",
        entity_type="case",
        entity_id=case.id,
        details=f"Target Department: {payload.target_department} | Action: {payload.action_type} | Notes: {payload.notes}"
    )
    db.add(log)
    db.commit()

    return {
        "message": f"Action request forwarded to {payload.target_department}",
        "alert_id": alert.id,
        "case_number": case.case_number
    }

@router.put("/compensations/{id}/assessment")
@router.put("/compensation/{id}/assessment")
@router.put("/{id}/assessment")
def update_compensation_assessment(
    id: int,
    payload: CompensationAssessmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "compensation_officer"]))
):
    c = db.query(Compensation).filter(Compensation.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Compensation record not found")

    if payload.base_land_value_inr is not None:
        c.base_land_value_inr = payload.base_land_value_inr
    if payload.solatium_100pct_inr is not None:
        c.solatium_100pct_inr = payload.solatium_100pct_inr
    if payload.additional_interest_inr is not None:
        c.additional_interest_inr = payload.additional_interest_inr
    if payload.total_award_inr is not None:
        c.total_award_inr = payload.total_award_inr
    if payload.landowner_share_inr is not None:
        c.landowner_share_inr = payload.landowner_share_inr

    c.updated_at = datetime.utcnow()
    c.responsible_officer_id = current_user.id

    log = ActivityLog(
        user_id=current_user.id,
        action="Compensation Assessment Updated",
        entity_type="compensation",
        entity_id=c.id,
        details=payload.remarks or f"Award recalculated: ₹{float(c.total_award_inr):,.2f} (Base: ₹{float(c.base_land_value_inr):,.2f}, Solatium: ₹{float(c.solatium_100pct_inr):,.2f})"
    )
    db.add(log)
    db.commit()
    db.refresh(c)

    RiskRecalculationService.recalculate_case_risk(db, c.case_id, trigger_reason="Compensation Assessment Updated by Officer")

    return {
        "message": "Compensation assessment updated successfully",
        "compensation_id": c.id,
        "total_award_inr": float(c.total_award_inr or 0.0),
        "landowner_share_inr": float(c.landowner_share_inr or 0.0)
    }

@router.get("/compensations", response_model=List[CompensationResponse])
@router.get("/compensation", response_model=List[CompensationResponse])
@router.get("", response_model=List[CompensationResponse])
def list_compensations(
    case_id: Optional[int] = None,
    stage: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(Compensation)
    if current_user and current_user.role == "landowner":
        lo_profile = db.query(Landowner).filter(Landowner.user_id == current_user.id).first()
        if lo_profile:
            query = query.filter(Compensation.landowner_id == lo_profile.id)
        else:
            query = query.filter(Compensation.landowner.has(Landowner.full_name.ilike(f"%{current_user.full_name}%")))
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
            stage=c.current_stage,
            stage_index=c.stage_index,
            stages_timeline=timeline,
            bank_details=bank,
            mock_payment_ref=c.mock_payment_ref
        ))
    return results

@router.get("/compensations/{id}", response_model=CompensationResponse)
@router.get("/compensation/{id}", response_model=CompensationResponse)
def get_compensation(id: int, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    c = db.query(Compensation).filter(Compensation.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Compensation record not found")

    if current_user and current_user.role == "landowner":
        lo_profile = db.query(Landowner).filter(Landowner.user_id == current_user.id).first()
        if lo_profile and c.landowner_id != lo_profile.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Landowners can only view their own compensation records")

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
        stage=c.current_stage,
        stage_index=c.stage_index,
        stages_timeline=timeline,
        bank_details=bank,
        mock_payment_ref=c.mock_payment_ref
    )

@router.put("/compensations/{id}/stage")
@router.put("/compensation/{id}/stage")
def update_compensation_stage(
    id: int,
    payload: CompensationStageUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "compensation_officer"]))
):
    c = db.query(Compensation).filter(Compensation.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Compensation record not found")

    new_stage = payload.stage_name or payload.stage
    if not new_stage:
        raise HTTPException(status_code=400, detail="stage_name or stage is required")

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

    # Record immutable audit activity log
    act_log = ActivityLog(
        user_id=current_user.id,
        action=f"Compensation stage updated to '{new_stage}'",
        entity_type="compensation",
        entity_id=c.id,
        details=payload.remarks or f"Stage progressed to '{new_stage}' (Case #{c.case.case_number if c.case else c.case_id}, Plot #{c.parcel.plot_number if c.parcel else ''})"
    )
    db.add(act_log)

    db.commit()
    db.refresh(c)

    # Dispatch alert & SMS
    NotificationService.create_alert(
        db=db,
        title="Compensation Stage Updated",
        message=f"Compensation for Plot #{c.parcel.plot_number if c.parcel else ''} advanced to '{new_stage}'. Award Amount: Rs. {float(c.landowner_share_inr)/100000:.2f} Lakhs.",
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
        "stage": c.current_stage,
        "stage_index": c.stage_index
    }
