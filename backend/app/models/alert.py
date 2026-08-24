from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    alert_type = Column(String(40), nullable=False)
    severity = Column(String(20), default="info") # critical, warning, info, success
    case_id = Column(Integer, ForeignKey("acquisition_cases.id"), nullable=True)
    parcel_id = Column(Integer, ForeignKey("parcels.id"), nullable=True)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    target_role = Column(String(40), nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    mock_sms_dispatched = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    target_user = relationship("User", back_populates="alerts")
