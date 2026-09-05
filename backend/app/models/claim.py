from sqlalchemy import Column, Integer, String, Text, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class LandownerClaim(Base):
    __tablename__ = "landowner_claims"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("acquisition_cases.id", ondelete="CASCADE"), nullable=False)
    parcel_id = Column(Integer, ForeignKey("parcels.id", ondelete="SET NULL"), nullable=True)
    landowner_id = Column(Integer, ForeignKey("landowners.id", ondelete="CASCADE"), nullable=False)
    claim_number = Column(String(60), nullable=False, unique=True)
    claim_type = Column(String(80), nullable=False, default="Compensation Claim") # Compensation Claim, Valuation Objection, R&R Relief, Title Verification
    claimed_amount_inr = Column(Numeric(14, 2), nullable=True, default=0.0)
    description = Column(Text, nullable=False)
    status = Column(String(40), nullable=False, default="Under Review") # Under Review, Approved, Rejected, Revision Requested
    officer_decision_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("AcquisitionCase", backref="claims")
    parcel = relationship("Parcel", backref="claims")
    landowner = relationship("Landowner", backref="claims")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
