from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import shutil

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.schemas.survey import (
    SurveyDashboardSummary,
    SurveyRequestListItem,
    SurveyRequestDetailResponse,
    SurveyRequestCreate,
    SurveyScheduleCreate,
    SurveyDocVerifyBatch,
    SurveyGpsCheck,
    SurveyGpsResponse,
    SurveyObservationsUpdate,
    SurveyEvidenceCreate,
    SurveyEvidenceResponse,
    SurveyDiscrepancyCreate,
    SurveyDiscrepancyResponse,
    SurveyResurveyCreate,
    SurveySubmitRequest,
    SurveyReviewAction,
    SurveyStatusHistoryResponse
)
from app.services.survey_service import SurveyService

router = APIRouter(prefix="/surveys", tags=["Survey Operations"])


@router.get("/dashboard/summary", response_model=SurveyDashboardSummary)
def get_survey_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["survey_officer", "admin"]))
):
    """Retrieves operational summary KPIs and delay metrics for the Survey Officer Dashboard."""
    return SurveyService.get_dashboard_summary(db=db, current_user=current_user)


@router.get("", response_model=List[SurveyRequestListItem])
def list_survey_requests(
    status: Optional[str] = Query(None, description="Filter by survey lifecycle status"),
    priority: Optional[str] = Query(None, description="Filter by priority (Low, Medium, High, Urgent)"),
    district: Optional[str] = Query(None, description="Filter by district"),
    village: Optional[str] = Query(None, description="Filter by village name"),
    search: Optional[str] = Query(None, description="Search by request number, landowner, or plot"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["survey_officer", "admin"]))
):
    """Lists assigned survey requests with multi-parameter filtering and search."""
    return SurveyService.get_surveys_list(
        db=db,
        current_user=current_user,
        status_filter=status,
        priority_filter=priority,
        district_filter=district,
        village_filter=village,
        search=search
    )


@router.post("/request", status_code=status.HTTP_201_CREATED)
def create_survey_request(
    request_in: SurveyRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "land_acquisition_officer", "survey_officer"]))
):
    """LAO, Admin, or Survey Officer initiates a new Survey Request."""
    survey = SurveyService.create_survey_request(db=db, request_in=request_in, current_user=current_user)
    return {"status": "SUCCESS", "message": f"Survey Request {survey.request_number} created.", "id": survey.id}


@router.get("/{id}", response_model=SurveyRequestDetailResponse)
def get_survey_request_detail(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["survey_officer", "admin"]))
):
    """Retrieves complete details for a specific survey request, including all sub-modules."""
    return SurveyService.get_survey_detail(db=db, survey_id=id, current_user=current_user)


@router.put("/{id}/accept")
def accept_survey_assignment(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["survey_officer", "admin"]))
):
    """Survey Officer accepts survey assignment."""
    return SurveyService.accept_survey(db=db, survey_id=id, current_user=current_user)


@router.put("/{id}/schedule")
def schedule_physical_survey(
    id: int,
    schedule_in: SurveyScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["survey_officer", "admin"]))
):
    """Survey Officer schedules the date and team for physical field survey."""
    return SurveyService.schedule_survey(db=db, survey_id=id, schedule_in=schedule_in, current_user=current_user)


@router.put("/{id}/start")
def start_field_survey(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["survey_officer", "admin"]))
):
    """Survey Officer starts the field survey and begins live location logging."""
    return SurveyService.start_survey(db=db, survey_id=id, current_user=current_user)


@router.put("/{id}/documents/verify")
def verify_survey_documents(
    id: int,
    batch_in: SurveyDocVerifyBatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["survey_officer", "admin"]))
):
    """Verifies land documents (RoR, deed, map) and flags mismatches."""
    return SurveyService.verify_documents(db=db, survey_id=id, batch_in=batch_in, current_user=current_user)


@router.post("/{id}/gps/verify", response_model=SurveyGpsResponse)
def verify_field_gps_location(
    id: int,
    gps_in: SurveyGpsCheck,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["survey_officer", "admin"]))
):
    """Captures device or manual GPS coordinates and compares against official parcel geometry."""
    res = SurveyService.verify_gps(db=db, survey_id=id, gps_in=gps_in, current_user=current_user)
    from datetime import datetime
    return {
        "id": id,
        "survey_request_id": id,
        "captured_latitude": res["captured_latitude"],
        "captured_longitude": res["captured_longitude"],
        "expected_latitude": res["expected_latitude"],
        "expected_longitude": res["expected_longitude"],
        "distance_from_expected_meters": res["distance_meters"],
        "location_status": res["location_status"],
        "is_manual_entry": gps_in.is_manual_entry,
        "captured_at": datetime.utcnow(),
        "survey_points_geojson": gps_in.survey_points_geojson
    }


@router.put("/{id}/observations")
def update_field_observations(
    id: int,
    obs_in: SurveyObservationsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["survey_officer", "admin"]))
):
    """Saves structured field observations (observed area, land use, structures, occupancy, boundary)."""
    return SurveyService.update_observations(db=db, survey_id=id, obs_in=obs_in, current_user=current_user)


@router.post("/{id}/evidence", response_model=SurveyEvidenceResponse)
def upload_field_evidence(
    id: int,
    ev_in: SurveyEvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["survey_officer", "admin"]))
):
    """Attaches photo/video evidence to survey record."""
    evidence = SurveyService.add_evidence(db=db, survey_id=id, ev_in=ev_in, current_user=current_user)
    return {
        "id": evidence.id,
        "survey_request_id": evidence.survey_request_id,
        "category": evidence.category,
        "title": evidence.title,
        "description": evidence.description,
        "file_path": evidence.file_path,
        "file_type": evidence.file_type,
        "latitude": float(evidence.latitude) if evidence.latitude else None,
        "longitude": float(evidence.longitude) if evidence.longitude else None,
        "uploaded_at": evidence.uploaded_at,
        "uploaded_by_name": current_user.full_name
    }


@router.post("/{id}/discrepancies", response_model=SurveyDiscrepancyResponse)
def add_survey_discrepancy(
    id: int,
    disc_in: SurveyDiscrepancyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["survey_officer", "admin"]))
):
    """Flags a field survey discrepancy with severity tag."""
    disc = SurveyService.add_discrepancy(db=db, survey_id=id, disc_in=disc_in, current_user=current_user)
    return {
        "id": disc.id,
        "survey_request_id": disc.survey_request_id,
        "category": disc.category,
        "description": disc.description,
        "severity": disc.severity,
        "evidence_id": disc.evidence_id,
        "remarks": disc.remarks,
        "created_at": disc.created_at
    }


@router.post("/{id}/resurvey")
def request_resurvey_workflow(
    id: int,
    resurvey_in: SurveyResurveyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["survey_officer", "admin"]))
):
    """Initiates a formal resurvey request to the Land Acquisition Officer."""
    return SurveyService.request_resurvey(db=db, survey_id=id, resurvey_in=resurvey_in, current_user=current_user)


@router.post("/{id}/submit")
def submit_survey_report_for_review(
    id: int,
    submit_in: SurveySubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["survey_officer", "admin"]))
):
    """Survey Officer digitally certifies and submits the completed survey report to LAO/CO."""
    return SurveyService.submit_survey_report(db=db, survey_id=id, submit_in=submit_in, current_user=current_user)


@router.put("/{id}/review")
def review_survey_report(
    id: int,
    review_in: SurveyReviewAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "land_acquisition_officer", "compensation_officer"]))
):
    """LAO or Compensation Officer reviews submitted survey report (Approve, Return for Correction, Resurvey)."""
    return SurveyService.review_survey_report(db=db, survey_id=id, review_in=review_in, current_user=current_user)
