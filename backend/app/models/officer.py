from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    officer_id = Column(String(50), unique=True, index=True, nullable=False)
    department = Column(String(120), nullable=False)
    designation = Column(String(120), nullable=False)
    office_name = Column(String(150), nullable=False)
    office_code = Column(String(50), index=True, nullable=False)
    district = Column(String(60), nullable=False)
    authorization_doc_path = Column(Text, nullable=True)
    verification_status = Column(String(30), default="PENDING_VERIFICATION")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="officer_profile")


class OfficerVerificationRecord(Base):
    __tablename__ = "officer_verification_records"

    id = Column(Integer, primary_key=True, index=True)
    officer_id = Column(String(50), unique=True, index=True, nullable=False)
    official_email = Column(String(120), unique=True, index=True, nullable=False)
    full_name = Column(String(120), nullable=False)
    department = Column(String(120), nullable=False)
    designation = Column(String(120), nullable=False)
    office_code = Column(String(50), index=True, nullable=False)
    district = Column(String(60), nullable=False)
    verification_status = Column(String(30), default="VERIFIED")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
