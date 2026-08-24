from sqlalchemy import Column, Integer, String, Text, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(40), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    executing_agency = Column(String(150), nullable=True)
    project_authority_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    state = Column(String(50), default="Odisha")
    districts = Column(String(255), nullable=True)
    target_start_date = Column(Date, nullable=True)
    target_end_date = Column(Date, nullable=True)
    estimated_budget_cr = Column(Numeric(12, 2), default=0.0)
    total_area_required_acres = Column(Numeric(10, 2), default=0.0)
    status = Column(String(40), default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    cases = relationship("AcquisitionCase", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("DepartmentalTask", back_populates="project", cascade="all, delete-orphan")
