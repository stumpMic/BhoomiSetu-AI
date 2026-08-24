from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class DepartmentalTask(Base):
    __tablename__ = "departmental_tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    case_id = Column(Integer, ForeignKey("acquisition_cases.id"), nullable=True, index=True)
    parcel_id = Column(Integer, ForeignKey("parcels.id"), nullable=True, index=True)
    assigned_department_id = Column(Integer, ForeignKey("departments.id"), nullable=False, index=True)
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    priority = Column(String(20), default="Medium") # Low, Medium, High, Urgent
    status = Column(String(30), default="To do", index=True) # To do, In progress, Waiting for info, Completed, Overdue
    start_date = Column(Date, nullable=True)
    deadline = Column(Date, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    is_overdue = Column(Boolean, default=False)
    remarks = Column(Text, nullable=True)
    completion_evidence = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    case = relationship("AcquisitionCase", back_populates="tasks")
    parcel = relationship("Parcel", back_populates="tasks")
    assigned_department = relationship("Department", back_populates="tasks")
    assigned_officer = relationship("User", back_populates="assigned_tasks")
