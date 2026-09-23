from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class OwnerShare(BaseModel):
    id: int
    name: str
    share_pct: float
    phone: Optional[str] = None
    masked_aadhaar: Optional[str] = None
    bank_verification_status: Optional[str] = None

class ParcelResponse(BaseModel):
    id: int
    case_id: int
    case_number: Optional[str] = None
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    village_id: int
    village_name: Optional[str] = None
    district: Optional[str] = None
    plot_number: str
    khata_number: str
    area_acres: float
    land_type: str
    valuation_per_acre_inr: float
    total_valuation_inr: float
    risk_level: str
    risk_color: str
    survey_status: str
    acquisition_status: str
    compensation_stage: Optional[str] = None
    compensation_amount: Optional[float] = 0.0
    owners: List[OwnerShare] = []
    pending_tasks_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ParcelFeatureProperties(BaseModel):
    id: int
    plot_number: str
    khata_number: str
    village_name: str
    district: str
    area_acres: float
    land_type: str
    risk_level: str
    risk_color: str
    delay_probability: float
    case_id: int
    case_number: str
    project_name: str
    survey_status: Optional[str] = "Pending"
    acquisition_status: Optional[str] = "Notification"
    consent_status: Optional[str] = "Pending Consultation"
    compensation_stage: Optional[str] = None
    compensation_status: Optional[str] = "Pending Verification"
    document_status: Optional[str] = "RoR Verified"
    visual_state: Optional[str] = "normal"
    valuation_per_acre_inr: Optional[float] = 1000000.0
    total_valuation_inr: Optional[float] = 0.0
    compensation_amount: Optional[float] = 0.0
    owners: List[OwnerShare] = []
    pending_tasks_count: Optional[int] = 0
    conflict_reason: Optional[str] = None
    conflict_type: Optional[str] = None
    current_process_stage: Optional[str] = None
    survey_number: Optional[str] = None
    parcel_id: Optional[str] = None
    owner_consent_status: Optional[str] = None

class GeoJSONGeometry(BaseModel):
    type: str
    coordinates: Any

class ParcelFeature(BaseModel):
    type: str = "Feature"
    id: int
    geometry: GeoJSONGeometry
    properties: ParcelFeatureProperties

class ParcelFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[ParcelFeature]
