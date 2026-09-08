from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(String(40), nullable=False, index=True) # admin, project_authority, land_acquisition_officer, survey_officer, compensation_officer, landowner
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    district = Column(String(60), nullable=True)
    state = Column(String(60), default="Odisha")
    address = Column(Text, nullable=True)
    verification_status = Column(String(30), default="PENDING_VERIFICATION", index=True) # PENDING_VERIFICATION, VERIFIED, REJECTED, SUSPENDED
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="users")
    landowner_profile = relationship("Landowner", back_populates="user", uselist=False)
    officer_profile = relationship("Officer", back_populates="user", uselist=False)
    assigned_cases = relationship("AcquisitionCase", back_populates="assigned_officer")
    assigned_tasks = relationship("DepartmentalTask", back_populates="assigned_officer")
    alerts = relationship("Alert", back_populates="target_user")
    verification_requests = relationship("VerificationRequest", foreign_keys="VerificationRequest.user_id", back_populates="user", cascade="all, delete-orphan")
    reviewed_verifications = relationship("VerificationRequest", foreign_keys="VerificationRequest.reviewed_by_id", back_populates="reviewed_by")
