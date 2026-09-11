from app.database import Base
from app.models.department import Department
from app.models.user import User
from app.models.project import Project
from app.models.village import Village
from app.models.acquisition_case import AcquisitionCase
from app.models.parcel import Parcel, ParcelOwnership
from app.models.landowner import Landowner
from app.models.officer import Officer, OfficerVerificationRecord
from app.models.verification_record import LandVerificationRecord, VerificationRequest
from app.models.document import Document, OCRResult
from app.models.compensation import Compensation, CompensationStageLog
from app.models.task import DepartmentalTask
from app.models.prediction import RiskPrediction, PredictionFactor
from app.models.alert import Alert
from app.models.grievance import Grievance, GrievanceUpdate
from app.models.activity_log import ActivityLog
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

from app.models.hearing import Hearing
from app.models.notice import Notice
from app.models.claim import LandownerClaim

__all__ = [
    "Base",
    "Department",
    "User",
    "Project",
    "Village",
    "AcquisitionCase",
    "Parcel",
    "ParcelOwnership",
    "Landowner",
    "Officer",
    "OfficerVerificationRecord",
    "LandVerificationRecord",
    "VerificationRequest",
    "Document",
    "OCRResult",
    "Compensation",
    "CompensationStageLog",
    "DepartmentalTask",
    "RiskPrediction",
    "PredictionFactor",
    "Alert",
    "Grievance",
    "GrievanceUpdate",
    "ActivityLog",
<<<<<<< HEAD
    "SurveyRequest",
    "SurveyDocumentVerification",
    "SurveySchedule",
    "SurveyGpsVerification",
    "SurveyFieldObservation",
    "SurveyEvidence",
    "SurveyDiscrepancy",
    "SurveyResurveyRequest",
    "SurveyReport",
    "SurveyStatusHistory",
    "SurveyPredictiveMetrics"
=======
    "Hearing",
    "Notice",
    "LandownerClaim",
>>>>>>> f935a84b8be2cede8150d23f515708eb4dbd6d5c
]
