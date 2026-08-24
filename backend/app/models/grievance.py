from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(Integer, primary_key=True, index=True)
    grievance_number = Column(String(50), unique=True, index=True, nullable=False)
    case_id = Column(Integer, ForeignKey("acquisition_cases.id"), nullable=True)
    parcel_id = Column(Integer, ForeignKey("parcels.id"), nullable=True)
    landowner_id = Column(Integer, ForeignKey("landowners.id"), nullable=False, index=True)
    category = Column(String(60), nullable=False) # Ownership dispute, Incorrect land measurement, etc.
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(30), default="Submitted", index=True) # Submitted, Assigned, Under Review, Action Taken, Resolved
    assigned_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("AcquisitionCase", back_populates="grievances")
    landowner = relationship("Landowner", back_populates="grievances")
    updates = relationship("GrievanceUpdate", back_populates="grievance", cascade="all, delete-orphan")


class GrievanceUpdate(Base):
    __tablename__ = "grievance_updates"

    id = Column(Integer, primary_key=True, index=True)
    grievance_id = Column(Integer, ForeignKey("grievances.id"), nullable=False, index=True)
    stage = Column(String(40), nullable=False)
    updated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    remarks = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    grievance = relationship("Grievance", back_populates="updates")
