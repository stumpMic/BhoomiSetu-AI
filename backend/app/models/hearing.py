from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Hearing(Base):
    __tablename__ = "hearings"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("acquisition_cases.id", ondelete="CASCADE"), nullable=False)
    hearing_type = Column(String(80), nullable=False, default="Section 15 Objections Hearing")
    title = Column(String(200), nullable=False)
    hearing_date = Column(Date, nullable=False)
    hearing_time = Column(String(20), nullable=False, default="10:30 AM")
    venue_or_mode = Column(String(200), nullable=False, default="Collectorate Conference Hall, Khurda")
    participants = Column(Text, nullable=True)
    purpose = Column(Text, nullable=True)
    status = Column(String(40), nullable=False, default="Scheduled") # Scheduled, Completed, Postponed, Cancelled
    minutes_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    case = relationship("AcquisitionCase", backref="hearings")
