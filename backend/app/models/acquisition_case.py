from sqlalchemy import Column, Integer, String, Boolean, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class AcquisitionCase(Base):
    __tablename__ = "acquisition_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True, nullable=False)
    plot_number = Column(String(50), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False, index=True)
    notification_section = Column(String(20), default="4(1)")
    current_stage = Column(String(60), default="Notification", index=True)
    status = Column(String(40), default="In Progress", index=True)
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    target_deadline = Column(Date, nullable=True)
    
    # Live ML & Risk Metrics
    current_delay_probability = Column(Numeric(4, 3), default=0.0)
    current_risk_level = Column(String(20), default="Low", index=True)
    predicted_delay_days = Column(Integer, default=0)
    
    missing_doc_pct = Column(Numeric(5, 2), default=0.0)
    survey_completed_pct = Column(Numeric(5, 2), default=0.0)
    ownership_disputes_count = Column(Integer, default=0)
    court_cases_count = Column(Integer, default=0)
    pending_approvals_count = Column(Integer, default=0)
    compensation_progress_pct = Column(Numeric(5, 2), default=0.0)
    bank_verification_pct = Column(Numeric(5, 2), default=0.0)
    environmental_clearance = Column(Boolean, default=True)
    rehabilitation_required = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="cases")
    village = relationship("Village", back_populates="cases")
    assigned_officer = relationship("User", back_populates="assigned_cases")
    parcels = relationship("Parcel", back_populates="case", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    tasks = relationship("DepartmentalTask", back_populates="case", cascade="all, delete-orphan")
    predictions = relationship("RiskPrediction", back_populates="case", cascade="all, delete-orphan")
    grievances = relationship("Grievance", back_populates="case", cascade="all, delete-orphan")
    compensations = relationship("Compensation", back_populates="case", cascade="all, delete-orphan")

    @property
    def title(self):
        if self.project and self.project.name:
            return f"{self.project.name} - {self.case_number}"
        return f"Case {self.case_number}"

    @property
    def district(self):
        if self.village and self.village.district:
            return self.village.district
        return "Khurda"

    @property
    def risk_score(self):
        return float(self.current_delay_probability or 0.0)

    @property
    def risk_level(self):
        return self.current_risk_level or "Low"

