import json
import math
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc
from fastapi import HTTPException, status

from app.models.survey import (
    SurveyRequest,
    SurveyDocumentVerification,
    SurveySchedule,
    SurveyGpsVerification,
    SurveyFieldObservation,
    SurveyEvidence,
    SurveyDiscrepancy,
    SurveyResurveyRequest,
    SurveyReport,
    SurveyStatusHistory,
    SurveyPredictiveMetrics
)
from app.models.parcel import Parcel, ParcelOwnership
from app.models.acquisition_case import AcquisitionCase
from app.models.village import Village
from app.models.user import User
from app.models.document import Document
from app.models.alert import Alert
from app.schemas.survey import (
    SurveyRequestCreate,
    SurveyScheduleCreate,
    SurveyDocVerifyBatch,
    SurveyGpsCheck,
    SurveyObservationsUpdate,
    SurveyEvidenceCreate,
    SurveyDiscrepancyCreate,
    SurveyResurveyCreate,
    SurveyReportGenerate,
    SurveySubmitRequest,
    SurveyReviewAction
)
from app.services.risk_recalculation_service import RiskRecalculationService

def calculate_haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance between two GPS coordinates in meters using the Haversine formula."""
    R = 6371000.0 # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


class SurveyService:

    @staticmethod
    def get_dashboard_summary(db: Session, current_user: Optional[User] = None) -> Dict[str, Any]:
        """Calculates operational KPIs and delay metrics for the Survey Officer Dashboard."""
        today = date.today()
        seven_days_later = today + timedelta(days=7)

        query = db.query(SurveyRequest)
        if current_user and current_user.role == "survey_officer":
            query = query.filter(
                or_(SurveyRequest.assigned_so_id == current_user.id, SurveyRequest.assigned_so_id.is_(None))
            )

        all_surveys = query.all()
        total_assigned = len(all_surveys)
        pending_surveys = sum(1 for s in all_surveys if s.status == "ASSIGNED")
        scheduled_surveys = sum(1 for s in all_surveys if s.status == "SCHEDULED")
        in_progress_surveys = sum(1 for s in all_surveys if s.status == "IN_PROGRESS")
        submitted_surveys = sum(1 for s in all_surveys if s.status in ["SUBMITTED", "UNDER_REVIEW"])
        completed_surveys = sum(1 for s in all_surveys if s.status == "COMPLETED" or s.status == "APPROVED")
        resurvey_required = sum(1 for s in all_surveys if s.status == "RESURVEY_REQUIRED")
        returned_for_correction = sum(1 for s in all_surveys if s.status == "RETURNED")

        # Operational Delay Indicators
        approaching_deadline = sum(
            1 for s in all_surveys
            if s.deadline and s.deadline >= today and s.deadline <= seven_days_later and s.status not in ["COMPLETED", "APPROVED"]
        )
        overdue_count = sum(
            1 for s in all_surveys
            if s.deadline and s.deadline < today and s.status not in ["COMPLETED", "APPROVED"]
        )

        # Count surveys with document mismatches/missing
        doc_issue_req_ids = set()
        for s in all_surveys:
            for doc in s.document_verifications:
                if doc.verification_status in ["MISMATCH", "MISSING"]:
                    doc_issue_req_ids.add(s.id)
                    break
        waiting_for_documents = len(doc_issue_req_ids)

        # Average survey duration in days
        completed_durations = []
        for s in all_surveys:
            if s.assignment_date and s.survey_completed_date:
                duration = (s.survey_completed_date - s.assignment_date).total_seconds() / 86400.0
                completed_durations.append(duration)
        avg_duration = round(sum(completed_durations) / len(completed_durations), 1) if completed_durations else 4.2

        # Average delay risk
        risk_scores = []
        for s in all_surveys:
            if s.case and s.case.current_delay_probability is not None:
                risk_scores.append(float(s.case.current_delay_probability))
        avg_risk_pct = round((sum(risk_scores) / len(risk_scores)) * 100.0, 1) if risk_scores else 42.0

        return {
            "total_assigned": total_assigned,
            "pending_surveys": pending_surveys,
            "scheduled_surveys": scheduled_surveys,
            "in_progress_surveys": in_progress_surveys,
            "submitted_surveys": submitted_surveys,
            "completed_surveys": completed_surveys,
            "resurvey_required": resurvey_required,
            "returned_for_correction": returned_for_correction,
            "approaching_deadline_count": approaching_deadline,
            "overdue_count": overdue_count,
            "waiting_for_documents_count": waiting_for_documents,
            "waiting_for_resurvey_count": resurvey_required,
            "avg_survey_duration_days": avg_duration,
            "avg_delay_risk_pct": avg_risk_pct
        }

    @staticmethod
    def get_surveys_list(
        db: Session,
        current_user: Optional[User] = None,
        status_filter: Optional[str] = None,
        priority_filter: Optional[str] = None,
        district_filter: Optional[str] = None,
        village_filter: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Queries and formats survey requests with flexible filtering and search."""
        query = db.query(SurveyRequest).join(Parcel, SurveyRequest.parcel_id == Parcel.id)

        if current_user and current_user.role == "survey_officer":
            query = query.filter(
                or_(SurveyRequest.assigned_so_id == current_user.id, SurveyRequest.assigned_so_id.is_(None))
            )

        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(SurveyRequest.status == status_filter.upper())

        if priority_filter and priority_filter.upper() != "ALL":
            query = query.filter(SurveyRequest.priority == priority_filter)

        if district_filter:
            query = query.filter(Parcel.village.has(Village.district.ilike(f"%{district_filter}%")))

        if village_filter:
            query = query.filter(Parcel.village.has(name=village_filter))

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    SurveyRequest.request_number.ilike(search_term),
                    Parcel.plot_number.ilike(search_term),
                    Parcel.khata_number.ilike(search_term),
                    SurveyRequest.purpose.ilike(search_term)
                )
            )

        results = query.order_by(desc(SurveyRequest.assignment_date)).all()
        today = date.today()

        formatted = []
        for req in results:
            parcel = req.parcel
            case = req.case
            village = parcel.village if parcel else None
            village_name = village.name if village else "Pipili"
            district_name = village.district if village else "Khurda"
            
            # Primary landowner
            owner_name = "Bikram Keshari Das"
            if parcel and parcel.ownerships:
                primary = next((o for o in parcel.ownerships if o.is_primary_contact), parcel.ownerships[0])
                if primary and primary.landowner:
                    owner_name = primary.landowner.full_name

            is_overdue = bool(req.deadline and req.deadline < today and req.status not in ["COMPLETED", "APPROVED"])
            risk_score = float(case.current_delay_probability) if case and case.current_delay_probability is not None else 0.45
            risk_level = case.current_risk_level if case and case.current_risk_level else "Medium"

            formatted.append({
                "id": req.id,
                "request_number": req.request_number,
                "case_id": req.case_id,
                "case_number": case.case_number if case else f"CASE-{req.case_id}",
                "project_name": case.project.name if case and case.project else "NH-316 Highway Expansion",
                "parcel_id": req.parcel_id,
                "plot_number": parcel.plot_number if parcel else "101",
                "khata_number": parcel.khata_number if parcel else "312",
                "village_name": village_name,
                "district": district_name,
                "recorded_area_acres": float(parcel.area_acres) if parcel else 4.5,
                "landowner_name": owner_name,
                "lao_name": req.lao.full_name if req.lao else "LAO Ashok Patra",
                "assigned_so_id": req.assigned_so_id,
                "assigned_so_name": req.assigned_so.full_name if req.assigned_so else "Sunita Mishra",
                "status": req.status,
                "priority": req.priority,
                "purpose": req.purpose,
                "assignment_date": req.assignment_date,
                "scheduled_date": req.scheduled_date,
                "deadline": req.deadline,
                "is_overdue": is_overdue,
                "delay_risk_level": risk_level,
                "delay_risk_score": risk_score
            })

        return formatted

    @staticmethod
    def get_survey_detail(db: Session, survey_id: int, current_user: Optional[User] = None) -> Dict[str, Any]:
        """Retrieves full details for a survey request including all sub-modules."""
        req = db.query(SurveyRequest).filter(SurveyRequest.id == survey_id).first()
        if not req:
            raise HTTPException(status_code=404, detail=f"Survey request #{survey_id} not found.")

        parcel = req.parcel
        case = req.case
        project = case.project if case else None
        village = parcel.village if parcel else None

        owner_name = "Bikram Keshari Das"
        owner_phone = "+91 94370 12345"
        if parcel and parcel.ownerships:
            primary = next((o for o in parcel.ownerships if o.is_primary_contact), parcel.ownerships[0])
            if primary and primary.landowner:
                owner_name = primary.landowner.full_name
                owner_phone = primary.landowner.phone

        # Coordinates
        expected_lat = 20.124500
        expected_lon = 85.832400
        if req.gps_verification and req.gps_verification.expected_latitude:
            expected_lat = float(req.gps_verification.expected_latitude)
            expected_lon = float(req.gps_verification.expected_longitude)
        elif village and village.latitude:
            expected_lat = float(village.latitude)
            expected_lon = float(village.longitude)

        # Populate initial documents if none exist
        if not req.document_verifications:
            initial_docs = [
                ("Record of Rights (RoR)", f"RoR Khatiyan No. {parcel.khata_number if parcel else '312'}", "sample-documents/valid_ror_plot142a.txt"),
                ("Land ownership document", "Registered Sale Deed / Title Deed", "sample-documents/valid_ror_plot142a.txt"),
                ("Land map", f"Cadastral Village Map Sheet - {village.name if village else 'Pipili'}", "sample-documents/valid_ror_plot142a.txt")
            ]
            for doc_type, title, fpath in initial_docs:
                doc_ver = SurveyDocumentVerification(
                    survey_request_id=req.id,
                    doc_type=doc_type,
                    doc_title=title,
                    file_path=fpath,
                    verification_status="NOT_VERIFIED"
                )
                db.add(doc_ver)
            db.commit()
            db.refresh(req)

        # History
        history_list = []
        for h in req.status_history:
            history_list.append({
                "id": h.id,
                "previous_status": h.previous_status,
                "new_status": h.new_status,
                "action": h.action,
                "remarks": h.remarks,
                "performed_by_name": h.performed_by.full_name if h.performed_by else "System Officer",
                "timestamp": h.timestamp
            })

        # Evidence
        evidence_list = []
        for e in req.evidence_items:
            evidence_list.append({
                "id": e.id,
                "survey_request_id": e.survey_request_id,
                "category": e.category,
                "title": e.title,
                "description": e.description,
                "file_path": e.file_path,
                "file_type": e.file_type,
                "latitude": float(e.latitude) if e.latitude else None,
                "longitude": float(e.longitude) if e.longitude else None,
                "uploaded_at": e.uploaded_at,
                "uploaded_by_name": e.uploaded_by.full_name if e.uploaded_by else "Survey Officer"
            })

        # Discrepancies
        discrepancies_list = []
        for d in req.discrepancies:
            discrepancies_list.append({
                "id": d.id,
                "survey_request_id": d.survey_request_id,
                "category": d.category,
                "description": d.description,
                "severity": d.severity,
                "evidence_id": d.evidence_id,
                "remarks": d.remarks,
                "created_at": d.created_at
            })

        # Resurveys
        resurvey_list = []
        for r in req.resurvey_requests:
            resurvey_list.append({
                "id": r.id,
                "original_survey_request_id": r.original_survey_request_id,
                "new_survey_request_id": r.new_survey_request_id,
                "resurvey_reason": r.resurvey_reason,
                "priority": r.priority,
                "required_action": r.required_action,
                "supporting_evidence": r.supporting_evidence,
                "remarks": r.remarks,
                "requested_by_name": r.requested_by.full_name if r.requested_by else "Survey Officer",
                "requested_at": r.requested_at,
                "status": r.status,
                "reviewed_at": r.reviewed_at
            })

        # Doc verifications
        doc_list = []
        for dv in req.document_verifications:
            doc_list.append({
                "id": dv.id,
                "survey_request_id": dv.survey_request_id,
                "document_id": dv.document_id,
                "doc_type": dv.doc_type,
                "doc_title": dv.doc_title,
                "file_path": dv.file_path,
                "verification_status": dv.verification_status,
                "mismatch_details": dv.mismatch_details,
                "remarks": dv.remarks,
                "verified_at": dv.verified_at
            })

        # Schedule
        schedule_data = None
        if req.schedule:
            schedule_data = {
                "id": req.schedule.id,
                "survey_request_id": req.schedule.survey_request_id,
                "scheduled_date": req.schedule.scheduled_date,
                "scheduled_time": req.schedule.scheduled_time,
                "expected_duration_hours": float(req.schedule.expected_duration_hours),
                "field_team_members": req.schedule.field_team_members,
                "special_instructions": req.schedule.special_instructions,
                "notes": req.schedule.notes,
                "created_at": req.schedule.created_at
            }

        # GPS
        gps_data = None
        if req.gps_verification:
            gps_data = {
                "id": req.gps_verification.id,
                "survey_request_id": req.gps_verification.survey_request_id,
                "captured_latitude": float(req.gps_verification.captured_latitude) if req.gps_verification.captured_latitude else None,
                "captured_longitude": float(req.gps_verification.captured_longitude) if req.gps_verification.captured_longitude else None,
                "expected_latitude": float(req.gps_verification.expected_latitude) if req.gps_verification.expected_latitude else None,
                "expected_longitude": float(req.gps_verification.expected_longitude) if req.gps_verification.expected_longitude else None,
                "distance_from_expected_meters": float(req.gps_verification.distance_from_expected_meters) if req.gps_verification.distance_from_expected_meters else None,
                "location_status": req.gps_verification.location_status,
                "is_manual_entry": req.gps_verification.is_manual_entry,
                "captured_at": req.gps_verification.captured_at,
                "survey_points_geojson": req.gps_verification.survey_points_geojson
            }

        # Field observation
        obs_data = None
        if req.field_observation:
            obs = req.field_observation
            obs_data = {
                "id": obs.id,
                "survey_request_id": obs.survey_request_id,
                "observed_area_acres": float(obs.observed_area_acres) if obs.observed_area_acres else None,
                "land_use": obs.land_use,
                "crop_type": obs.crop_type,
                "irrigation_available": obs.irrigation_available,
                "general_condition": obs.general_condition,
                "has_house": obs.has_house,
                "has_building": obs.has_building,
                "has_boundary_wall": obs.has_boundary_wall,
                "has_well": obs.has_well,
                "has_pond": obs.has_pond,
                "trees_count": obs.trees_count,
                "has_electrical_infra": obs.has_electrical_infra,
                "other_structures": obs.other_structures,
                "landowner_present": obs.landowner_present,
                "occupant_present": obs.occupant_present,
                "tenant_present": obs.tenant_present,
                "occupancy_remarks": obs.occupancy_remarks,
                "boundary_status": obs.boundary_status,
                "boundary_remarks": obs.boundary_remarks,
                "updated_at": obs.updated_at
            }

        # Report
        report_data = None
        if req.report:
            rep = req.report
            report_data = {
                "id": rep.id,
                "report_number": rep.report_number,
                "survey_request_id": rep.survey_request_id,
                "final_recommendation": rep.final_recommendation,
                "final_remarks": rep.final_remarks,
                "is_digitally_confirmed": rep.is_digitally_confirmed,
                "certified_by_officer_id": rep.certified_by_officer_id,
                "certified_officer_name": rep.certified_officer_name,
                "certified_at": rep.certified_at,
                "certification_statement": rep.certification_statement,
                "checklist_json": rep.checklist_json,
                "report_summary_json": rep.report_summary_json,
                "generated_at": rep.generated_at,
                "submitted_at": rep.submitted_at,
                "lao_review_status": rep.lao_review_status,
                "lao_review_remarks": rep.lao_review_remarks,
                "lao_reviewed_at": rep.lao_reviewed_at,
                "co_review_status": rep.co_review_status,
                "co_review_remarks": rep.co_review_remarks,
                "co_reviewed_at": rep.co_reviewed_at
            }

        return {
            "id": req.id,
            "request_number": req.request_number,
            "case_id": req.case_id,
            "case_number": case.case_number if case else f"CASE-{req.case_id}",
            "case_title": case.title if case else "Acquisition Case",
            "project_id": project.id if project else 1,
            "project_name": project.name if project else "NH-316 Expansion",
            "parcel_id": req.parcel_id,
            "plot_number": parcel.plot_number if parcel else "101",
            "khata_number": parcel.khata_number if parcel else "312",
            "village_name": village.name if village else "Pipili",
            "district": case.district if case else "Khurda",
            "recorded_area_acres": float(parcel.area_acres) if parcel else 4.5,
            "land_type": parcel.land_type if parcel else "Agricultural",
            "landowner_name": owner_name,
            "landowner_phone": owner_phone,
            "lao_id": req.lao_id,
            "lao_name": req.lao.full_name if req.lao else "LAO Ashok Patra",
            "assigned_so_id": req.assigned_so_id,
            "assigned_so_name": req.assigned_so.full_name if req.assigned_so else "Sunita Mishra",
            "status": req.status,
            "priority": req.priority,
            "purpose": req.purpose,
            "instructions": req.instructions,
            "assignment_date": req.assignment_date,
            "accepted_date": req.accepted_date,
            "scheduled_date": req.scheduled_date,
            "survey_start_date": req.survey_start_date,
            "survey_completed_date": req.survey_completed_date,
            "submission_date": req.submission_date,
            "review_date": req.review_date,
            "deadline": req.deadline,
            "return_reason": req.return_reason,
            "parcel_geometry_geojson": parcel.geometry_geojson if parcel else None,
            "expected_latitude": expected_lat,
            "expected_longitude": expected_lon,
            "schedule": schedule_data,
            "document_verifications": doc_list,
            "gps_verification": gps_data,
            "field_observation": obs_data,
            "evidence_items": evidence_list,
            "discrepancies": discrepancies_list,
            "resurvey_requests": resurvey_list,
            "report": report_data,
            "status_history": history_list,
            "delay_risk_score": float(case.risk_score) if case and case.risk_score else 0.45,
            "delay_risk_level": case.risk_level if case and case.risk_level else "Medium",
            "predicted_delay_days": int(case.predicted_delay_days) if case and case.predicted_delay_days else 45
        }

    @staticmethod
    def create_survey_request(db: Session, request_in: SurveyRequestCreate, current_user: Optional[User] = None) -> SurveyRequest:
        """LAO creates a new survey request and assigns it to a Survey Officer."""
        # Generate Request Number
        count = db.query(SurveyRequest).count() + 1
        req_number = f"SURV-REQ-2026-{count:03d}"

        survey_req = SurveyRequest(
            request_number=req_number,
            case_id=request_in.case_id,
            parcel_id=request_in.parcel_id,
            lao_id=current_user.id if current_user else 2,
            assigned_so_id=request_in.assigned_so_id or 4, # Default SO Sunita Mishra
            status="ASSIGNED",
            priority=request_in.priority,
            purpose=request_in.purpose,
            instructions=request_in.instructions,
            assignment_date=datetime.utcnow(),
            deadline=request_in.deadline or (date.today() + timedelta(days=21))
        )
        db.add(survey_req)
        db.commit()
        db.refresh(survey_req)

        # Add initial status history
        history = SurveyStatusHistory(
            survey_request_id=survey_req.id,
            previous_status=None,
            new_status="ASSIGNED",
            action="Survey Request Created & Assigned",
            remarks=f"Assigned with priority '{request_in.priority}'. Purpose: {request_in.purpose}",
            performed_by_id=current_user.id if current_user else 2
        )
        db.add(history)

        # Initialize predictive delay metrics
        metrics = SurveyPredictiveMetrics(
            survey_request_id=survey_req.id,
            assignment_date=date.today()
        )
        db.add(metrics)
        db.commit()

        # Recalculate case risk
        RiskRecalculationService.recalculate_case_risk(db, request_in.case_id, trigger_reason="New Survey Request Assigned")

        return survey_req

    @staticmethod
    def accept_survey(db: Session, survey_id: int, current_user: Optional[User] = None) -> Dict[str, Any]:
        """SO accepts survey assignment."""
        req = db.query(SurveyRequest).filter(SurveyRequest.id == survey_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Survey request not found.")

        old_status = req.status
        req.status = "ACCEPTED"
        req.accepted_date = datetime.utcnow()
        if current_user:
            req.assigned_so_id = current_user.id

        history = SurveyStatusHistory(
            survey_request_id=req.id,
            previous_status=old_status,
            new_status="ACCEPTED",
            action="Survey Assignment Accepted",
            remarks="Survey officer accepted the field assignment and will initiate document verification.",
            performed_by_id=current_user.id if current_user else req.assigned_so_id
        )
        db.add(history)

        # Update metrics
        if req.predictive_metrics:
            req.predictive_metrics.acceptance_date = date.today()

        db.commit()
        return {"status": "SUCCESS", "message": f"Survey {req.request_number} accepted successfully.", "new_status": "ACCEPTED"}

    @staticmethod
    def schedule_survey(db: Session, survey_id: int, schedule_in: SurveyScheduleCreate, current_user: Optional[User] = None) -> Dict[str, Any]:
        """SO schedules physical field survey."""
        req = db.query(SurveyRequest).filter(SurveyRequest.id == survey_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Survey request not found.")

        if req.status in ["COMPLETED", "APPROVED"]:
            raise HTTPException(status_code=400, detail="Cannot schedule a survey that has already been completed.")

        old_status = req.status
        req.status = "SCHEDULED"
        req.scheduled_date = schedule_in.scheduled_date

        if req.schedule:
            req.schedule.scheduled_date = schedule_in.scheduled_date
            req.schedule.scheduled_time = schedule_in.scheduled_time
            req.schedule.expected_duration_hours = schedule_in.expected_duration_hours
            req.schedule.field_team_members = schedule_in.field_team_members
            req.schedule.special_instructions = schedule_in.special_instructions
            req.schedule.notes = schedule_in.notes
        else:
            sched = SurveySchedule(
                survey_request_id=req.id,
                scheduled_date=schedule_in.scheduled_date,
                scheduled_time=schedule_in.scheduled_time,
                expected_duration_hours=schedule_in.expected_duration_hours,
                field_team_members=schedule_in.field_team_members,
                special_instructions=schedule_in.special_instructions,
                notes=schedule_in.notes
            )
            db.add(sched)

        history = SurveyStatusHistory(
            survey_request_id=req.id,
            previous_status=old_status,
            new_status="SCHEDULED",
            action="Field Survey Scheduled",
            remarks=f"Field survey scheduled for {schedule_in.scheduled_date} at {schedule_in.scheduled_time}.",
            performed_by_id=current_user.id if current_user else req.assigned_so_id
        )
        db.add(history)

        if req.predictive_metrics:
            req.predictive_metrics.scheduled_date = schedule_in.scheduled_date

        db.commit()
        return {"status": "SUCCESS", "message": f"Survey scheduled for {schedule_in.scheduled_date}.", "new_status": "SCHEDULED"}

    @staticmethod
    def start_survey(db: Session, survey_id: int, current_user: Optional[User] = None) -> Dict[str, Any]:
        """SO marks survey as IN_PROGRESS and begins recording timestamps."""
        req = db.query(SurveyRequest).filter(SurveyRequest.id == survey_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Survey request not found.")

        old_status = req.status
        req.status = "IN_PROGRESS"
        req.survey_start_date = datetime.utcnow()

        history = SurveyStatusHistory(
            survey_request_id=req.id,
            previous_status=old_status,
            new_status="IN_PROGRESS",
            action="Field Survey Started",
            remarks="Survey Officer commenced field survey on site. Geolocation and observation logging active.",
            performed_by_id=current_user.id if current_user else req.assigned_so_id
        )
        db.add(history)

        if req.predictive_metrics:
            req.predictive_metrics.survey_start_date = date.today()

        db.commit()
        return {"status": "SUCCESS", "message": f"Survey {req.request_number} is now In Progress.", "new_status": "IN_PROGRESS"}

    @staticmethod
    def verify_documents(db: Session, survey_id: int, batch_in: SurveyDocVerifyBatch, current_user: Optional[User] = None) -> Dict[str, Any]:
        """Updates document verification statuses and calculates mismatch flags."""
        req = db.query(SurveyRequest).filter(SurveyRequest.id == survey_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Survey request not found.")

        mismatches_count = 0
        missing_count = 0

        for item in batch_in.documents:
            doc_rec = None
            if item.document_id:
                doc_rec = db.query(SurveyDocumentVerification).filter(
                    SurveyDocumentVerification.survey_request_id == req.id,
                    SurveyDocumentVerification.document_id == item.document_id
                ).first()

            if not doc_rec:
                doc_rec = db.query(SurveyDocumentVerification).filter(
                    SurveyDocumentVerification.survey_request_id == req.id,
                    SurveyDocumentVerification.doc_type == item.doc_type
                ).first()

            if doc_rec:
                doc_rec.verification_status = item.verification_status
                doc_rec.mismatch_details = item.mismatch_details
                doc_rec.remarks = item.remarks
                doc_rec.verified_at = datetime.utcnow()
                doc_rec.verified_by_id = current_user.id if current_user else req.assigned_so_id
            else:
                doc_rec = SurveyDocumentVerification(
                    survey_request_id=req.id,
                    doc_type=item.doc_type,
                    doc_title=item.doc_title,
                    file_path=item.file_path,
                    verification_status=item.verification_status,
                    mismatch_details=item.mismatch_details,
                    remarks=item.remarks,
                    verified_at=datetime.utcnow(),
                    verified_by_id=current_user.id if current_user else req.assigned_so_id
                )
                db.add(doc_rec)

            if item.verification_status == "MISMATCH":
                mismatches_count += 1
            elif item.verification_status == "MISSING":
                missing_count += 1

        # Update metrics
        if req.predictive_metrics:
            req.predictive_metrics.document_mismatches_count = mismatches_count
            req.predictive_metrics.missing_docs_count = missing_count

        history = SurveyStatusHistory(
            survey_request_id=req.id,
            previous_status=req.status,
            new_status=req.status,
            action="Documents Verified",
            remarks=f"Document verification completed. {mismatches_count} mismatch(es), {missing_count} missing.",
            performed_by_id=current_user.id if current_user else req.assigned_so_id
        )
        db.add(history)
        db.commit()

        return {"status": "SUCCESS", "message": "Document verifications updated successfully.", "mismatches": mismatches_count, "missing": missing_count}

    @staticmethod
    def verify_gps(db: Session, survey_id: int, gps_in: SurveyGpsCheck, current_user: Optional[User] = None) -> Dict[str, Any]:
        """Calculates proximity of captured device GPS coords against expected cadastral parcel."""
        req = db.query(SurveyRequest).filter(SurveyRequest.id == survey_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Survey request not found.")

        parcel = req.parcel
        village = parcel.village if parcel else None

        # Expected coords
        expected_lat = 20.124580
        expected_lon = 85.832450
        if village and village.latitude:
            expected_lat = float(village.latitude)
            expected_lon = float(village.longitude)

        distance_meters = None
        loc_status = "GPS UNAVAILABLE"

        if gps_in.captured_latitude and gps_in.captured_longitude:
            distance_meters = calculate_haversine_distance_meters(
                gps_in.captured_latitude,
                gps_in.captured_longitude,
                expected_lat,
                expected_lon
            )

            if gps_in.is_manual_entry:
                loc_status = "MANUALLY ENTERED"
            elif distance_meters <= 50.0:
                loc_status = "LOCATION VERIFIED"
            elif distance_meters <= 300.0:
                loc_status = "NEAR EXPECTED LOCATION"
            else:
                loc_status = "LOCATION MISMATCH"

        if req.gps_verification:
            req.gps_verification.captured_latitude = gps_in.captured_latitude
            req.gps_verification.captured_longitude = gps_in.captured_longitude
            req.gps_verification.expected_latitude = expected_lat
            req.gps_verification.expected_longitude = expected_lon
            req.gps_verification.distance_from_expected_meters = distance_meters
            req.gps_verification.location_status = loc_status
            req.gps_verification.is_manual_entry = gps_in.is_manual_entry
            req.gps_verification.captured_at = datetime.utcnow()
            req.gps_verification.survey_points_geojson = gps_in.survey_points_geojson
        else:
            gps_rec = SurveyGpsVerification(
                survey_request_id=req.id,
                captured_latitude=gps_in.captured_latitude,
                captured_longitude=gps_in.captured_longitude,
                expected_latitude=expected_lat,
                expected_longitude=expected_lon,
                distance_from_expected_meters=distance_meters,
                location_status=loc_status,
                is_manual_entry=gps_in.is_manual_entry,
                captured_at=datetime.utcnow(),
                survey_points_geojson=gps_in.survey_points_geojson
            )
            db.add(gps_rec)

        if req.predictive_metrics:
            req.predictive_metrics.gps_mismatch = (loc_status == "LOCATION MISMATCH")

        history = SurveyStatusHistory(
            survey_request_id=req.id,
            previous_status=req.status,
            new_status=req.status,
            action="GPS / Location Recorded",
            remarks=f"GPS coordinates captured: {gps_in.captured_latitude}, {gps_in.captured_longitude}. Status: {loc_status} (Offset: {distance_meters}m).",
            performed_by_id=current_user.id if current_user else req.assigned_so_id
        )
        db.add(history)
        db.commit()

        return {
            "status": "SUCCESS",
            "location_status": loc_status,
            "distance_meters": distance_meters,
            "captured_latitude": gps_in.captured_latitude,
            "captured_longitude": gps_in.captured_longitude,
            "expected_latitude": expected_lat,
            "expected_longitude": expected_lon
        }

    @staticmethod
    def update_observations(db: Session, survey_id: int, obs_in: SurveyObservationsUpdate, current_user: Optional[User] = None) -> Dict[str, Any]:
        """Saves structured field observations (land use, structures, occupancy, boundary)."""
        req = db.query(SurveyRequest).filter(SurveyRequest.id == survey_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Survey request not found.")

        if req.field_observation:
            obs = req.field_observation
            obs.observed_area_acres = obs_in.observed_area_acres
            obs.land_use = obs_in.land_use
            obs.crop_type = obs_in.crop_type
            obs.irrigation_available = obs_in.irrigation_available
            obs.general_condition = obs_in.general_condition
            obs.has_house = obs_in.has_house
            obs.has_building = obs_in.has_building
            obs.has_boundary_wall = obs_in.has_boundary_wall
            obs.has_well = obs_in.has_well
            obs.has_pond = obs_in.has_pond
            obs.trees_count = obs_in.trees_count
            obs.has_electrical_infra = obs_in.has_electrical_infra
            obs.other_structures = obs_in.other_structures
            obs.landowner_present = obs_in.landowner_present
            obs.occupant_present = obs_in.occupant_present
            obs.tenant_present = obs_in.tenant_present
            obs.occupancy_remarks = obs_in.occupancy_remarks
            obs.boundary_status = obs_in.boundary_status
            obs.boundary_remarks = obs_in.boundary_remarks
            obs.updated_at = datetime.utcnow()
        else:
            obs = SurveyFieldObservation(
                survey_request_id=req.id,
                observed_area_acres=obs_in.observed_area_acres,
                land_use=obs_in.land_use,
                crop_type=obs_in.crop_type,
                irrigation_available=obs_in.irrigation_available,
                general_condition=obs_in.general_condition,
                has_house=obs_in.has_house,
                has_building=obs_in.has_building,
                has_boundary_wall=obs_in.has_boundary_wall,
                has_well=obs_in.has_well,
                has_pond=obs_in.has_pond,
                trees_count=obs_in.trees_count,
                has_electrical_infra=obs_in.has_electrical_infra,
                other_structures=obs_in.other_structures,
                landowner_present=obs_in.landowner_present,
                occupant_present=obs_in.occupant_present,
                tenant_present=obs_in.tenant_present,
                occupancy_remarks=obs_in.occupancy_remarks,
                boundary_status=obs_in.boundary_status,
                boundary_remarks=obs_in.boundary_remarks
            )
            db.add(obs)

        if req.predictive_metrics:
            req.predictive_metrics.boundary_mismatch = (obs_in.boundary_status != "Boundary matches records")
            req.predictive_metrics.landowner_availability_issue = not obs_in.landowner_present

        history = SurveyStatusHistory(
            survey_request_id=req.id,
            previous_status=req.status,
            new_status=req.status,
            action="Field Observations Saved",
            remarks=f"Recorded observed area: {obs_in.observed_area_acres} Acres. Boundary: {obs_in.boundary_status}.",
            performed_by_id=current_user.id if current_user else req.assigned_so_id
        )
        db.add(history)
        db.commit()

        return {"status": "SUCCESS", "message": "Field observations saved successfully."}

    @staticmethod
    def add_evidence(db: Session, survey_id: int, ev_in: SurveyEvidenceCreate, current_user: Optional[User] = None) -> SurveyEvidence:
        """Attaches photo/video evidence to survey record."""
        req = db.query(SurveyRequest).filter(SurveyRequest.id == survey_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Survey request not found.")

        evidence = SurveyEvidence(
            survey_request_id=req.id,
            category=ev_in.category,
            title=ev_in.title,
            description=ev_in.description,
            file_path=ev_in.file_path,
            file_type=ev_in.file_type,
            latitude=ev_in.latitude,
            longitude=ev_in.longitude,
            uploaded_at=datetime.utcnow(),
            uploaded_by_id=current_user.id if current_user else req.assigned_so_id
        )
        db.add(evidence)

        history = SurveyStatusHistory(
            survey_request_id=req.id,
            previous_status=req.status,
            new_status=req.status,
            action="Evidence Uploaded",
            remarks=f"Uploaded {ev_in.file_type}: '{ev_in.title}' ({ev_in.category}).",
            performed_by_id=current_user.id if current_user else req.assigned_so_id
        )
        db.add(history)
        db.commit()
        db.refresh(evidence)

        return evidence

    @staticmethod
    def add_discrepancy(db: Session, survey_id: int, disc_in: SurveyDiscrepancyCreate, current_user: Optional[User] = None) -> SurveyDiscrepancy:
        """Flags a field survey discrepancy with severity tag."""
        req = db.query(SurveyRequest).filter(SurveyRequest.id == survey_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Survey request not found.")

        disc = SurveyDiscrepancy(
            survey_request_id=req.id,
            category=disc_in.category,
            description=disc_in.description,
            severity=disc_in.severity.upper(),
            evidence_id=disc_in.evidence_id,
            remarks=disc_in.remarks,
            created_at=datetime.utcnow()
        )
        db.add(disc)

        if req.predictive_metrics:
            req.predictive_metrics.discrepancies_count += 1
            if disc_in.severity.upper() in ["HIGH", "CRITICAL"]:
                req.predictive_metrics.critical_discrepancies_count += 1

        history = SurveyStatusHistory(
            survey_request_id=req.id,
            previous_status=req.status,
            new_status=req.status,
            action=f"Discrepancy Flagged [{disc_in.severity.upper()}]",
            remarks=f"{disc_in.category}: {disc_in.description}",
            performed_by_id=current_user.id if current_user else req.assigned_so_id
        )
        db.add(history)
        db.commit()
        db.refresh(disc)

        # Trigger ML delay recalculation
        RiskRecalculationService.recalculate_case_risk(db, req.case_id, trigger_reason=f"Survey Discrepancy Flagged: {disc_in.category}")

        return disc

    @staticmethod
    def request_resurvey(db: Session, survey_id: int, resurvey_in: SurveyResurveyCreate, current_user: Optional[User] = None) -> Dict[str, Any]:
        """Initiates resurvey request workflow and notifies LAO."""
        req = db.query(SurveyRequest).filter(SurveyRequest.id == survey_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Survey request not found.")

        old_status = req.status
        req.status = "RESURVEY_REQUIRED"

        resurvey_req = SurveyResurveyRequest(
            original_survey_request_id=req.id,
            resurvey_reason=resurvey_in.resurvey_reason,
            priority=resurvey_in.priority,
            required_action=resurvey_in.required_action,
            supporting_evidence=resurvey_in.supporting_evidence,
            remarks=resurvey_in.remarks,
            requested_by_id=current_user.id if current_user else req.assigned_so_id,
            requested_at=datetime.utcnow(),
            status="PENDING_LAO_REVIEW"
        )
        db.add(resurvey_req)

        if req.predictive_metrics:
            req.predictive_metrics.resurvey_requests_count += 1

        history = SurveyStatusHistory(
            survey_request_id=req.id,
            previous_status=old_status,
            new_status="RESURVEY_REQUIRED",
            action="Resurvey Requested",
            remarks=f"Resurvey required: {resurvey_in.resurvey_reason}",
            performed_by_id=current_user.id if current_user else req.assigned_so_id
        )
        db.add(history)
        db.commit()

        # Recalculate risk (delays increase)
        RiskRecalculationService.recalculate_case_risk(db, req.case_id, trigger_reason="Resurvey Required for Parcel")

        return {"status": "SUCCESS", "message": "Resurvey request submitted to LAO.", "new_status": "RESURVEY_REQUIRED"}

    @staticmethod
    def submit_survey_report(db: Session, survey_id: int, submit_in: SurveySubmitRequest, current_user: Optional[User] = None) -> Dict[str, Any]:
        """SO certifies report digitally and submits to LAO & CO for review."""
        req = db.query(SurveyRequest).filter(SurveyRequest.id == survey_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Survey request not found.")

        if not submit_in.digital_signature_confirmed:
            raise HTTPException(status_code=400, detail="Digital confirmation declaration is required prior to submission.")

        old_status = req.status
        req.status = "SUBMITTED"
        req.survey_completed_date = datetime.utcnow()
        req.submission_date = datetime.utcnow()

        report_num = f"SURV-REP-2026-{req.id:03d}"
        officer_name = current_user.full_name if current_user else (req.assigned_so.full_name if req.assigned_so else "Sunita Mishra")

        if req.report:
            rep = req.report
            rep.final_recommendation = submit_in.final_recommendation
            rep.final_remarks = submit_in.final_remarks
            rep.is_digitally_confirmed = True
            rep.certified_by_officer_id = current_user.id if current_user else req.assigned_so_id
            rep.certified_officer_name = officer_name
            rep.certified_at = datetime.utcnow()
            rep.certification_statement = submit_in.certification_statement
            rep.submitted_at = datetime.utcnow()
        else:
            rep = SurveyReport(
                report_number=report_num,
                survey_request_id=req.id,
                final_recommendation=submit_in.final_recommendation,
                final_remarks=submit_in.final_remarks,
                is_digitally_confirmed=True,
                certified_by_officer_id=current_user.id if current_user else req.assigned_so_id,
                certified_officer_name=officer_name,
                certified_at=datetime.utcnow(),
                certification_statement=submit_in.certification_statement,
                generated_at=datetime.utcnow(),
                submitted_at=datetime.utcnow()
            )
            db.add(rep)

        # Update metrics
        if req.predictive_metrics:
            req.predictive_metrics.survey_completion_date = date.today()
            req.predictive_metrics.submission_date = date.today()

        history = SurveyStatusHistory(
            survey_request_id=req.id,
            previous_status=old_status,
            new_status="SUBMITTED",
            action="Survey Report Digitally Certified & Submitted",
            remarks=f"Recommendation: {submit_in.final_recommendation}. Certified by {officer_name}.",
            performed_by_id=current_user.id if current_user else req.assigned_so_id
        )
        db.add(history)
        db.commit()

        return {"status": "SUCCESS", "message": f"Survey report {report_num} submitted successfully for review.", "new_status": "SUBMITTED"}

    @staticmethod
    def review_survey_report(db: Session, survey_id: int, review_in: SurveyReviewAction, current_user: Optional[User] = None) -> Dict[str, Any]:
        """LAO or Compensation Officer reviews submitted survey report (Approve, Return, Resurvey)."""
        req = db.query(SurveyRequest).filter(SurveyRequest.id == survey_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Survey request not found.")

        rep = req.report
        if not rep:
            raise HTTPException(status_code=400, detail="No survey report generated for this request yet.")

        old_status = req.status
        action = review_in.action.upper()
        reviewer_id = current_user.id if current_user else 2
        reviewer_name = current_user.full_name if current_user else "LAO Ashok Patra"

        if action == "APPROVE":
            req.status = "COMPLETED"
            req.review_date = datetime.utcnow()
            rep.lao_review_status = "APPROVED"
            rep.lao_review_remarks = review_in.remarks or "Survey report approved."
            rep.lao_reviewed_at = datetime.utcnow()
            rep.reviewed_by_lao_id = reviewer_id

            # Mark parcel survey completed
            if req.parcel:
                req.parcel.survey_status = "Completed"

            history_action = "Survey Approved & Completed"
            history_remarks = f"Approved by {reviewer_name}. Remarks: {review_in.remarks or 'All parameters verified.'}"

        elif action in ["RETURN_FOR_CORRECTION", "RETURN"]:
            req.status = "RETURNED"
            req.return_reason = review_in.corrections_required or review_in.remarks
            rep.lao_review_status = "RETURNED_FOR_CORRECTION"
            rep.lao_review_remarks = req.return_reason
            rep.lao_reviewed_at = datetime.utcnow()
            rep.reviewed_by_lao_id = reviewer_id

            if req.predictive_metrics:
                req.predictive_metrics.times_report_returned += 1
                req.predictive_metrics.corrections_count += 1

            history_action = "Survey Returned for Correction"
            history_remarks = f"Returned by {reviewer_name}. Required corrections: {req.return_reason}"

        elif action in ["REQUIRE_RESURVEY", "RESURVEY"]:
            req.status = "RESURVEY_REQUIRED"
            rep.lao_review_status = "RESURVEY_REQUIRED"
            rep.lao_review_remarks = review_in.remarks or "Resurvey required."
            rep.lao_reviewed_at = datetime.utcnow()
            rep.reviewed_by_lao_id = reviewer_id

            history_action = "Resurvey Mandated by Reviewing Authority"
            history_remarks = f"Resurvey ordered by {reviewer_name}. Reason: {review_in.remarks}"

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported review action: '{action}'.")

        history = SurveyStatusHistory(
            survey_request_id=req.id,
            previous_status=old_status,
            new_status=req.status,
            action=history_action,
            remarks=history_remarks,
            performed_by_id=reviewer_id
        )
        db.add(history)
        db.commit()

        # Recalculate project delay risk
        RiskRecalculationService.recalculate_case_risk(db, req.case_id, trigger_reason=f"Survey Review: {history_action}")

        return {"status": "SUCCESS", "message": f"Survey review updated: {history_action}.", "new_status": req.status}
