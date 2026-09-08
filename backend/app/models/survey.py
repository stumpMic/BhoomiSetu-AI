from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class SurveyRequest(Base):
    __tablename__ = "survey_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_number = Column(String(50), nullable=False, unique=True, index=True)
    case_id = Column(Integer, ForeignKey("acquisition_cases.id"), nullable=False, index=True)
    parcel_id = Column(Integer, ForeignKey("parcels.id"), nullable=False, index=True)
    lao_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_so_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    status = Column(String(30), default="ASSIGNED", index=True)
    priority = Column(String(20), default="Medium")
    purpose = Column(String(200), nullable=False)
    instructions = Column(Text, nullable=True)
    assignment_date = Column(DateTime, default=datetime.utcnow)
    accepted_date = Column(DateTime, nullable=True)
    scheduled_date = Column(Date, nullable=True)
    survey_start_date = Column(DateTime, nullable=True)
    survey_completed_date = Column(DateTime, nullable=True)
    submission_date = Column(DateTime, nullable=True)
    review_date = Column(DateTime, nullable=True)
    deadline = Column(Date, nullable=True)
    return_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("AcquisitionCase")
    parcel = relationship("Parcel")
    lao = relationship("User", foreign_keys=[lao_id])
    assigned_so = relationship("User", foreign_keys=[assigned_so_id])
    
    document_verifications = relationship("SurveyDocumentVerification", back_populates="survey_request", cascade="all, delete-orphan")
    schedule = relationship("SurveySchedule", back_populates="survey_request", uselist=False, cascade="all, delete-orphan")
    gps_verification = relationship("SurveyGpsVerification", back_populates="survey_request", uselist=False, cascade="all, delete-orphan")
    field_observation = relationship("SurveyFieldObservation", back_populates="survey_request", uselist=False, cascade="all, delete-orphan")
    evidence_items = relationship("SurveyEvidence", back_populates="survey_request", cascade="all, delete-orphan")
    discrepancies = relationship("SurveyDiscrepancy", back_populates="survey_request", cascade="all, delete-orphan")
    resurvey_requests = relationship("SurveyResurveyRequest", foreign_keys="SurveyResurveyRequest.original_survey_request_id", back_populates="original_survey_request", cascade="all, delete-orphan")
    report = relationship("SurveyReport", back_populates="survey_request", uselist=False, cascade="all, delete-orphan")
    status_history = relationship("SurveyStatusHistory", back_populates="survey_request", cascade="all, delete-orphan", order_by="desc(SurveyStatusHistory.timestamp)")
    predictive_metrics = relationship("SurveyPredictiveMetrics", back_populates="survey_request", uselist=False, cascade="all, delete-orphan")


class SurveyDocumentVerification(Base):
    __tablename__ = "survey_document_verifications"

    id = Column(Integer, primary_key=True, index=True)
    survey_request_id = Column(Integer, ForeignKey("survey_requests.id"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    doc_type = Column(String(80), nullable=False)
    doc_title = Column(String(150), nullable=False)
    file_path = Column(Text, nullable=True)
    verification_status = Column(String(30), default="NOT_VERIFIED") # VERIFIED, NOT_VERIFIED, MISMATCH, MISSING
    mismatch_details = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    survey_request = relationship("SurveyRequest", back_populates="document_verifications")
    document = relationship("Document")
    verified_by = relationship("User", foreign_keys=[verified_by_id])


class SurveySchedule(Base):
    __tablename__ = "survey_schedules"

    id = Column(Integer, primary_key=True, index=True)
    survey_request_id = Column(Integer, ForeignKey("survey_requests.id"), nullable=False, unique=True, index=True)
    scheduled_date = Column(Date, nullable=False)
    scheduled_time = Column(String(20), nullable=False)
    expected_duration_hours = Column(Numeric(4, 1), default=2.0)
    field_team_members = Column(Text, nullable=True)
    special_instructions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    survey_request = relationship("SurveyRequest", back_populates="schedule")


class SurveyGpsVerification(Base):
    __tablename__ = "survey_gps_verifications"

    id = Column(Integer, primary_key=True, index=True)
    survey_request_id = Column(Integer, ForeignKey("survey_requests.id"), nullable=False, unique=True, index=True)
    captured_latitude = Column(Numeric(10, 7), nullable=True)
    captured_longitude = Column(Numeric(10, 7), nullable=True)
    expected_latitude = Column(Numeric(10, 7), nullable=True)
    expected_longitude = Column(Numeric(10, 7), nullable=True)
    distance_from_expected_meters = Column(Numeric(8, 2), nullable=True)
    location_status = Column(String(40), default="GPS UNAVAILABLE") # LOCATION VERIFIED, NEAR EXPECTED LOCATION, LOCATION MISMATCH, GPS UNAVAILABLE, MANUALLY ENTERED
    is_manual_entry = Column(Boolean, default=False)
    captured_at = Column(DateTime, default=datetime.utcnow)
    survey_points_geojson = Column(Text, nullable=True)

    # Relationships
    survey_request = relationship("SurveyRequest", back_populates="gps_verification")


class SurveyFieldObservation(Base):
    __tablename__ = "survey_field_observations"

    id = Column(Integer, primary_key=True, index=True)
    survey_request_id = Column(Integer, ForeignKey("survey_requests.id"), nullable=False, unique=True, index=True)
    observed_area_acres = Column(Numeric(8, 3), nullable=True)
    land_use = Column(String(50), default="Agricultural")
    crop_type = Column(String(100), nullable=True)
    irrigation_available = Column(Boolean, default=False)
    general_condition = Column(Text, nullable=True)
    has_house = Column(Boolean, default=False)
    has_building = Column(Boolean, default=False)
    has_boundary_wall = Column(Boolean, default=False)
    has_well = Column(Boolean, default=False)
    has_pond = Column(Boolean, default=False)
    trees_count = Column(Integer, default=0)
    has_electrical_infra = Column(Boolean, default=False)
    other_structures = Column(Text, nullable=True)
    landowner_present = Column(Boolean, default=True)
    occupant_present = Column(Boolean, default=True)
    tenant_present = Column(Boolean, default=False)
    occupancy_remarks = Column(Text, nullable=True)
    boundary_status = Column(String(50), default="Boundary matches records")
    boundary_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    survey_request = relationship("SurveyRequest", back_populates="field_observation")


class SurveyEvidence(Base):
    __tablename__ = "survey_evidence"

    id = Column(Integer, primary_key=True, index=True)
    survey_request_id = Column(Integer, ForeignKey("survey_requests.id"), nullable=False, index=True)
    category = Column(String(60), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(Text, nullable=False)
    file_type = Column(String(20), default="photo") # photo, video, document
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    survey_request = relationship("SurveyRequest", back_populates="evidence_items")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])


class SurveyDiscrepancy(Base):
    __tablename__ = "survey_discrepancies"

    id = Column(Integer, primary_key=True, index=True)
    survey_request_id = Column(Integer, ForeignKey("survey_requests.id"), nullable=False, index=True)
    category = Column(String(60), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    evidence_id = Column(Integer, ForeignKey("survey_evidence.id"), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    survey_request = relationship("SurveyRequest", back_populates="discrepancies")
    evidence = relationship("SurveyEvidence")


class SurveyResurveyRequest(Base):
    __tablename__ = "survey_resurvey_requests"

    id = Column(Integer, primary_key=True, index=True)
    original_survey_request_id = Column(Integer, ForeignKey("survey_requests.id"), nullable=False, index=True)
    new_survey_request_id = Column(Integer, ForeignKey("survey_requests.id"), nullable=True)
    resurvey_reason = Column(Text, nullable=False)
    priority = Column(String(20), default="High")
    required_action = Column(Text, nullable=False)
    supporting_evidence = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(30), default="PENDING_LAO_REVIEW") # PENDING_LAO_REVIEW, APPROVED_FOR_RESURVEY, REJECTED
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    original_survey_request = relationship("SurveyRequest", foreign_keys=[original_survey_request_id], back_populates="resurvey_requests")
    new_survey_request = relationship("SurveyRequest", foreign_keys=[new_survey_request_id])
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])


class SurveyReport(Base):
    __tablename__ = "survey_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_number = Column(String(50), nullable=False, unique=True, index=True)
    survey_request_id = Column(Integer, ForeignKey("survey_requests.id"), nullable=False, unique=True, index=True)
    final_recommendation = Column(String(60), nullable=False)
    final_remarks = Column(Text, nullable=True)
    is_digitally_confirmed = Column(Boolean, default=False)
    certified_by_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    certified_officer_name = Column(String(120), nullable=True)
    certified_at = Column(DateTime, nullable=True)
    certification_statement = Column(Text, nullable=True)
    checklist_json = Column(Text, nullable=True)
    report_summary_json = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    reviewed_by_lao_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    lao_review_status = Column(String(30), nullable=True) # APPROVED, RETURNED_FOR_CORRECTION, RESURVEY_REQUIRED, REJECTED
    lao_review_remarks = Column(Text, nullable=True)
    lao_reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_co_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    co_review_status = Column(String(30), nullable=True)
    co_review_remarks = Column(Text, nullable=True)
    co_reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    survey_request = relationship("SurveyRequest", back_populates="report")
    certified_by_officer = relationship("User", foreign_keys=[certified_by_officer_id])
    reviewed_by_lao = relationship("User", foreign_keys=[reviewed_by_lao_id])
    reviewed_by_co = relationship("User", foreign_keys=[reviewed_by_co_id])


class SurveyStatusHistory(Base):
    __tablename__ = "survey_status_history"

    id = Column(Integer, primary_key=True, index=True)
    survey_request_id = Column(Integer, ForeignKey("survey_requests.id"), nullable=False, index=True)
    previous_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    action = Column(String(100), nullable=False)
    remarks = Column(Text, nullable=True)
    performed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    survey_request = relationship("SurveyRequest", back_populates="status_history")
    performed_by = relationship("User", foreign_keys=[performed_by_id])


class SurveyPredictiveMetrics(Base):
    __tablename__ = "survey_predictive_metrics"

    id = Column(Integer, primary_key=True, index=True)
    survey_request_id = Column(Integer, ForeignKey("survey_requests.id"), nullable=False, unique=True, index=True)
    assignment_date = Column(Date, nullable=True)
    acceptance_date = Column(Date, nullable=True)
    scheduled_date = Column(Date, nullable=True)
    survey_start_date = Column(Date, nullable=True)
    survey_completion_date = Column(Date, nullable=True)
    submission_date = Column(Date, nullable=True)
    document_mismatches_count = Column(Integer, default=0)
    missing_docs_count = Column(Integer, default=0)
    discrepancies_count = Column(Integer, default=0)
    critical_discrepancies_count = Column(Integer, default=0)
    resurvey_requests_count = Column(Integer, default=0)
    corrections_count = Column(Integer, default=0)
    landowner_availability_issue = Column(Boolean, default=False)
    field_access_issue = Column(Boolean, default=False)
    boundary_mismatch = Column(Boolean, default=False)
    gps_mismatch = Column(Boolean, default=False)
    doc_verification_duration_days = Column(Numeric(5, 2), default=0.0)
    survey_duration_days = Column(Numeric(5, 2), default=0.0)
    review_duration_days = Column(Numeric(5, 2), default=0.0)
    times_report_returned = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    survey_request = relationship("SurveyRequest", back_populates="predictive_metrics")
