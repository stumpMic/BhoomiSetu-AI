from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class LandVerificationRecord(Base):
    __tablename__ = "land_verification_records"

    id = Column(Integer, primary_key=True, index=True)
    land_record_id = Column(String(50), unique=True, index=True, nullable=False)
    owner_name = Column(String(150), nullable=False)
    district = Column(String(60), nullable=False)
    tahasil = Column(String(60), nullable=False)
    village = Column(String(100), nullable=False)
    plot_number = Column(String(40), index=True, nullable=False)
    khata_number = Column(String(40), index=True, nullable=False)
    area_acres = Column(Numeric(8, 3), nullable=False)
    verification_status = Column(String(30), default="VERIFIED")
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class VerificationRequest(Base):
    __tablename__ = "verification_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    request_type = Column(String(30), nullable=False) # LANDOWNER, OFFICER
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(30), default="PENDING", index=True) # PENDING, APPROVED, REJECTED
    rejection_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    document_path = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="verification_requests")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id], back_populates="reviewed_verifications")
