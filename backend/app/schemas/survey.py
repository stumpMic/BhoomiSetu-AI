from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date

# ----------------------------------------------------
# 1. Survey Request Creation & Listing
# ----------------------------------------------------
class SurveyRequestCreate(BaseModel):
    case_id: int
    parcel_id: int
    assigned_so_id: Optional[int] = None
    priority: str = "Medium" # Low, Medium, High, Urgent
    purpose: str
    instructions: Optional[str] = None
    deadline: Optional[date] = None

class SurveyRequestListItem(BaseModel):
    id: int
    request_number: str
    case_id: int
    case_number: Optional[str] = None
    project_name: Optional[str] = None
    parcel_id: int
    plot_number: str
    khata_number: str
    village_name: str
    district: str
    recorded_area_acres: float
    landowner_name: Optional[str] = None
    lao_name: Optional[str] = None
    assigned_so_id: Optional[int] = None
    assigned_so_name: Optional[str] = None
    status: str
    priority: str
    purpose: str
    assignment_date: Optional[datetime] = None
    scheduled_date: Optional[date] = None
    deadline: Optional[date] = None
    is_overdue: bool = False
    delay_risk_level: Optional[str] = "Low"
    delay_risk_score: Optional[float] = 0.0
    has_field_observation: Optional[bool] = False
    observed_area_acres: Optional[float] = None
    has_ownership_dispute: Optional[bool] = False
    has_court_case: Optional[bool] = False
    has_structure_or_project: Optional[bool] = False
    survey_completed_date: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------------------------------------------
# 2. Survey Scheduling
# ----------------------------------------------------
class SurveyScheduleCreate(BaseModel):
    scheduled_date: date
    scheduled_time: str
    expected_duration_hours: float = 2.0
    field_team_members: Optional[str] = None
    special_instructions: Optional[str] = None
    notes: Optional[str] = None

class SurveyScheduleResponse(BaseModel):
    id: int
    survey_request_id: int
    scheduled_date: date
    scheduled_time: str
    expected_duration_hours: float
    field_team_members: Optional[str] = None
    special_instructions: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------------------------------------------
# 3. Document Verification
# ----------------------------------------------------
class SurveyDocVerifyItem(BaseModel):
    document_id: Optional[int] = None
    doc_type: str
    doc_title: str
    file_path: Optional[str] = None
    verification_status: str # VERIFIED, NOT_VERIFIED, MISMATCH, MISSING
    mismatch_details: Optional[str] = None
    remarks: Optional[str] = None

class SurveyDocVerifyBatch(BaseModel):
    documents: List[SurveyDocVerifyItem]

class SurveyDocVerifyResponse(BaseModel):
    id: int
    survey_request_id: int
    document_id: Optional[int] = None
    doc_type: str
    doc_title: str
    file_path: Optional[str] = None
    verification_status: str
    mismatch_details: Optional[str] = None
    remarks: Optional[str] = None
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------------------------------------------
# 4. GPS & Location Verification
# ----------------------------------------------------
class SurveyGpsCheck(BaseModel):
    captured_latitude: Optional[float] = None
    captured_longitude: Optional[float] = None
    is_manual_entry: bool = False
    survey_points_geojson: Optional[str] = None

class SurveyGpsResponse(BaseModel):
    id: int
    survey_request_id: int
    captured_latitude: Optional[float] = None
    captured_longitude: Optional[float] = None
    expected_latitude: Optional[float] = None
    expected_longitude: Optional[float] = None
    distance_from_expected_meters: Optional[float] = None
    location_status: str # LOCATION VERIFIED, NEAR EXPECTED LOCATION, LOCATION MISMATCH, GPS UNAVAILABLE, MANUALLY ENTERED
    is_manual_entry: bool
    captured_at: datetime
    survey_points_geojson: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------------------------------------------
# 5. Field Observations
# ----------------------------------------------------
class SurveyObservationsUpdate(BaseModel):
    observed_area_acres: Optional[float] = None
    land_use: str = "Agricultural" # Agricultural, Homestead, Commercial, Forest, Barren, Industrial
    crop_type: Optional[str] = None
    irrigation_available: bool = False
    general_condition: Optional[str] = None
    has_house: bool = False
    has_building: bool = False
    has_boundary_wall: bool = False
    has_well: bool = False
    has_pond: bool = False
    trees_count: int = 0
    has_electrical_infra: bool = False
    other_structures: Optional[str] = None
    landowner_present: bool = True
    occupant_present: bool = True
    tenant_present: bool = False
    occupancy_remarks: Optional[str] = None
    boundary_status: str = "Boundary matches records" # Boundary matches records, Boundary mismatch, Encroachment suspected, Neighboring parcel issue, Unable to verify, Other
    boundary_remarks: Optional[str] = None

    # Ownership Dispute
    has_ownership_dispute: bool = False
    dispute_nature: Optional[str] = None
    dispute_parties: Optional[str] = None
    dispute_details: Optional[str] = None
    dispute_remarks: Optional[str] = None

    # Court Case / Legal Dispute
    has_court_case: bool = False
    court_case_number: Optional[str] = None
    court_name: Optional[str] = None
    court_parties: Optional[str] = None
    court_case_description: Optional[str] = None
    court_case_status: Optional[str] = None
    court_case_remarks: Optional[str] = None

    # Structure / Project on Land
    has_structure_or_project: bool = False
    structure_type: Optional[str] = None
    structure_description: Optional[str] = None
    structure_location: Optional[str] = None
    structure_remarks: Optional[str] = None

class SurveyObservationsResponse(BaseModel):
    id: int
    survey_request_id: int
    observed_area_acres: Optional[float] = None
    land_use: str
    crop_type: Optional[str] = None
    irrigation_available: bool
    general_condition: Optional[str] = None
    has_house: bool
    has_building: bool
    has_boundary_wall: bool
    has_well: bool
    has_pond: bool
    trees_count: int
    has_electrical_infra: bool
    other_structures: Optional[str] = None
    landowner_present: bool
    occupant_present: bool
    tenant_present: bool
    occupancy_remarks: Optional[str] = None
    boundary_status: str
    boundary_remarks: Optional[str] = None

    # Ownership Dispute
    has_ownership_dispute: bool = False
    dispute_nature: Optional[str] = None
    dispute_parties: Optional[str] = None
    dispute_details: Optional[str] = None
    dispute_remarks: Optional[str] = None

    # Court Case / Legal Dispute
    has_court_case: bool = False
    court_case_number: Optional[str] = None
    court_name: Optional[str] = None
    court_parties: Optional[str] = None
    court_case_description: Optional[str] = None
    court_case_status: Optional[str] = None
    court_case_remarks: Optional[str] = None

    # Structure / Project on Land
    has_structure_or_project: bool = False
    structure_type: Optional[str] = None
    structure_description: Optional[str] = None
    structure_location: Optional[str] = None
    structure_remarks: Optional[str] = None

    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------------------------------------------
# 6. Evidence Items
# ----------------------------------------------------
class SurveyEvidenceCreate(BaseModel):
    category: str # Land Boundary, Parcel Location, Existing Structure, Crop, Road/Access, Occupation, Encroachment, Document Issue, Other
    title: str
    description: Optional[str] = None
    file_path: str
    file_type: str = "photo" # photo, video, document
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class SurveyEvidenceResponse(BaseModel):
    id: int
    survey_request_id: int
    category: str
    title: str
    description: Optional[str] = None
    file_path: str
    file_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    uploaded_at: datetime
    uploaded_by_name: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------------------------------------------
# 7. Discrepancies
# ----------------------------------------------------
class SurveyDiscrepancyCreate(BaseModel):
    category: str # Ownership mismatch, Area mismatch, Survey number mismatch, Plot number mismatch, Boundary mismatch, GIS/map vs ground mismatch, Missing document, Structure not recorded, Occupancy mismatch, Encroachment, Other
    description: str
    severity: str = "MEDIUM" # LOW, MEDIUM, HIGH, CRITICAL
    evidence_id: Optional[int] = None
    remarks: Optional[str] = None

class SurveyDiscrepancyResponse(BaseModel):
    id: int
    survey_request_id: int
    category: str
    description: str
    severity: str
    evidence_id: Optional[int] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------------------------------------------
# 8. Resurvey Workflow
# ----------------------------------------------------
class SurveyResurveyCreate(BaseModel):
    resurvey_reason: str
    priority: str = "High"
    required_action: str
    supporting_evidence: Optional[str] = None
    remarks: Optional[str] = None

class SurveyResurveyResponse(BaseModel):
    id: int
    original_survey_request_id: int
    new_survey_request_id: Optional[int] = None
    resurvey_reason: str
    priority: str
    required_action: str
    supporting_evidence: Optional[str] = None
    remarks: Optional[str] = None
    requested_by_name: Optional[str] = None
    requested_at: datetime
    status: str
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------------------------------------------
# 9. Survey Report & Digital Confirmation
# ----------------------------------------------------
class SurveyReportGenerate(BaseModel):
    final_recommendation: str # Survey Completed, Survey Completed with Discrepancy, Need Resurvey, Need Additional Documents, Boundary Verification Required, Landowner Verification Required, Field Measurement Required, Unable to Conduct Survey
    final_remarks: Optional[str] = None
    checklist_json: Optional[str] = None

class SurveySubmitRequest(BaseModel):
    digital_signature_confirmed: bool = True
    certification_statement: str = "I certify that the information recorded in this survey report is based on the field survey conducted by me."
    final_recommendation: str
    final_remarks: Optional[str] = None

class SurveyReviewAction(BaseModel):
    action: str # APPROVE, RETURN_FOR_CORRECTION, REQUIRE_RESURVEY, REJECT
    remarks: Optional[str] = None
    corrections_required: Optional[str] = None

class SurveyReportResponse(BaseModel):
    id: int
    report_number: str
    survey_request_id: int
    final_recommendation: str
    final_remarks: Optional[str] = None
    is_digitally_confirmed: bool
    certified_by_officer_id: Optional[int] = None
    certified_officer_name: Optional[str] = None
    certified_at: Optional[datetime] = None
    certification_statement: Optional[str] = None
    checklist_json: Optional[str] = None
    report_summary_json: Optional[str] = None
    generated_at: datetime
    submitted_at: Optional[datetime] = None
    lao_review_status: Optional[str] = None
    lao_review_remarks: Optional[str] = None
    lao_reviewed_at: Optional[datetime] = None
    co_review_status: Optional[str] = None
    co_review_remarks: Optional[str] = None
    co_reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------------------------------------------
# 10. Audit Timeline History
# ----------------------------------------------------
class SurveyStatusHistoryResponse(BaseModel):
    id: int
    previous_status: Optional[str] = None
    new_status: str
    action: str
    remarks: Optional[str] = None
    performed_by_name: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# ----------------------------------------------------
# 11. Full Survey Request Detail Response
# ----------------------------------------------------
class SurveyRequestDetailResponse(BaseModel):
    id: int
    request_number: str
    case_id: int
    case_number: str
    case_title: str
    title: Optional[str] = None
    project_id: int
    project_name: str
    parcel_id: int
    plot_number: str
    khata_number: str
    village_name: str
    district: str
    recorded_area_acres: float
    land_type: str
    landowner_name: str
    landowner_phone: Optional[str] = None
    lao_id: Optional[int] = None
    lao_name: Optional[str] = None
    assigned_so_id: Optional[int] = None
    assigned_so_name: Optional[str] = None
    status: str
    priority: str
    purpose: str
    instructions: Optional[str] = None
    assignment_date: Optional[datetime] = None
    accepted_date: Optional[datetime] = None
    scheduled_date: Optional[date] = None
    survey_start_date: Optional[datetime] = None
    survey_completed_date: Optional[datetime] = None
    submission_date: Optional[datetime] = None
    review_date: Optional[datetime] = None
    deadline: Optional[date] = None
    return_reason: Optional[str] = None
    parcel_geometry_geojson: Optional[str] = None
    expected_latitude: Optional[float] = None
    expected_longitude: Optional[float] = None
    
    # Nested Modules
    schedule: Optional[SurveyScheduleResponse] = None
    document_verifications: List[SurveyDocVerifyResponse] = []
    gps_verification: Optional[SurveyGpsResponse] = None
    field_observation: Optional[SurveyObservationsResponse] = None
    evidence_items: List[SurveyEvidenceResponse] = []
    discrepancies: List[SurveyDiscrepancyResponse] = []
    resurvey_requests: List[SurveyResurveyResponse] = []
    report: Optional[SurveyReportResponse] = None
    status_history: List[SurveyStatusHistoryResponse] = []
    delay_risk_score: Optional[float] = 0.0
    delay_risk_level: Optional[str] = "Low"
    predicted_delay_days: Optional[int] = 0

    class Config:
        from_attributes = True

# ----------------------------------------------------
# 12. Dashboard Summary & Operational Delay Indicators
# ----------------------------------------------------
class SurveyDashboardSummary(BaseModel):
    total_assigned: int = 0
    pending_surveys: int = 0
    scheduled_surveys: int = 0
    in_progress_surveys: int = 0
    submitted_surveys: int = 0
    completed_surveys: int = 0
    resurvey_required: int = 0
    returned_for_correction: int = 0
    
    # Operational Delay Indicators
    approaching_deadline_count: int = 0
    overdue_count: int = 0
    waiting_for_documents_count: int = 0
    waiting_for_resurvey_count: int = 0
    avg_survey_duration_days: float = 0.0
    avg_delay_risk_pct: float = 0.0
