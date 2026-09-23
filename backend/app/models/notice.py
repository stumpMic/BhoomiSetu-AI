from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("acquisition_cases.id", ondelete="CASCADE"), nullable=True)
    notice_number = Column(String(60), nullable=False, unique=True)
    notice_type = Column(String(80), nullable=False, default="Official Gazette / Public Notice")
    title = Column(String(200), nullable=False)
    content_summary = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False, default="Normal") # Normal, Important, Urgent
    deadline = Column(Date, nullable=True)
    issuing_authority = Column(String(120), default="Land Acquisition Officer, Khurda District")
    publish_date = Column(Date, nullable=False)
    status = Column(String(30), nullable=False, default="Draft") # Draft, Published, Sent/Issued, Deactivated
    is_active = Column(Boolean, default=True)
    issued_at = Column(DateTime, nullable=True)
    recipients_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("AcquisitionCase", backref="notices")
