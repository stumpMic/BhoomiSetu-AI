from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ExtractedFields(BaseModel):
    owner_name: Optional[str] = None
    plot_number: Optional[str] = None
    khata_number: Optional[str] = None
    village_name: Optional[str] = None
    area_acres: Optional[float] = None
    document_date: Optional[str] = None

class OfficialRecord(BaseModel):
    owner_name: Optional[str] = None
    plot_number: Optional[str] = None
    khata_number: Optional[str] = None
    village_name: Optional[str] = None
    area_acres: Optional[float] = None

class MismatchReport(BaseModel):
    has_discrepancy: bool
    name_similarity_score: float
    plot_match: bool
    khata_match: bool
    area_match: bool
    flagged_issues: List[str]
    officer_recommendation: str

class OCRResultResponse(BaseModel):
    document_id: int
    filename: str
    document_type: str
    uploaded_at: datetime
    uploaded_by_name: Optional[str] = None
    ocr_status: str
    ocr_confidence: float
    extracted_fields: ExtractedFields
    official_record: OfficialRecord
    mismatch_report: MismatchReport
    verification_history: List[Dict[str, Any]] = []

class DocumentVerifyRequest(BaseModel):
    status: str # Verified, Rejected, Manual Review Required
    officer_remarks: Optional[str] = None
