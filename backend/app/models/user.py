from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
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
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="users")
    landowner_profile = relationship("Landowner", back_populates="user", uselist=False)
    assigned_cases = relationship("AcquisitionCase", back_populates="assigned_officer")
    assigned_tasks = relationship("DepartmentalTask", back_populates="assigned_officer")
    alerts = relationship("Alert", back_populates="target_user")
