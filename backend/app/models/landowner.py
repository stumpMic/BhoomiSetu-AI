from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Landowner(Base):
    __tablename__ = "landowners"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)
    full_name = Column(String(150), nullable=False)
    father_or_husband_name = Column(String(150), nullable=True)
    gender = Column(String(10), nullable=True)
    phone = Column(String(20), nullable=True)
    masked_aadhaar = Column(String(20), default="XXXX-XXXX-1234")
    address = Column(Text, nullable=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=True)
    bank_account_masked = Column(String(30), default="XXXX-XXXX-5678")
    bank_ifsc = Column(String(20), default="SBIN0001234")
    bank_name = Column(String(100), default="State Bank of India")
    bank_verification_status = Column(String(30), default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="landowner_profile")
    village = relationship("Village", back_populates="landowners")
    ownerships = relationship("ParcelOwnership", back_populates="landowner", cascade="all, delete-orphan")
    compensations = relationship("Compensation", back_populates="landowner", cascade="all, delete-orphan")
    grievances = relationship("Grievance", back_populates="landowner", cascade="all, delete-orphan")
