from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Compensation(Base):
    __tablename__ = "compensations"

    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("parcels.id"), nullable=False, index=True)
    landowner_id = Column(Integer, ForeignKey("landowners.id"), nullable=False, index=True)
    case_id = Column(Integer, ForeignKey("acquisition_cases.id"), nullable=False, index=True)
    
    # Valuations under RFCTLARR Act 2013
    base_land_value_inr = Column(Numeric(14, 2), default=0.0)
    solatium_100pct_inr = Column(Numeric(14, 2), default=0.0)
    additional_interest_inr = Column(Numeric(14, 2), default=0.0)
    total_award_inr = Column(Numeric(14, 2), default=0.0)
    landowner_share_inr = Column(Numeric(14, 2), default=0.0)
    
    # 9-Stage Tracker
    current_stage = Column(String(60), default="Land valuation pending", index=True)
    stage_index = Column(Integer, default=1)
    responsible_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    mock_payment_ref = Column(String(80), nullable=True)
    payment_disbursed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('parcel_id', 'landowner_id', name='uq_compensation_parcel_owner'),
    )

    # Relationships
    parcel = relationship("Parcel", back_populates="compensations")
    landowner = relationship("Landowner", back_populates="compensations")
    case = relationship("AcquisitionCase", back_populates="compensations")
    stage_logs = relationship("CompensationStageLog", back_populates="compensation", cascade="all, delete-orphan")


class CompensationStageLog(Base):
    __tablename__ = "compensation_stages_log"

    id = Column(Integer, primary_key=True, index=True)
    compensation_id = Column(Integer, ForeignKey("compensations.id"), nullable=False, index=True)
    stage_name = Column(String(60), nullable=False)
    stage_index = Column(Integer, nullable=False)
    updated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    remarks = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    compensation = relationship("Compensation", back_populates="stage_logs")
