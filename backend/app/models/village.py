from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    tahsil = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(50), default="Odisha")
    pincode = Column(String(10), nullable=True)
    latitude = Column(Numeric(9, 6), nullable=True)
    longitude = Column(Numeric(9, 6), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    cases = relationship("AcquisitionCase", back_populates="village")
    parcels = relationship("Parcel", back_populates="village")
    landowners = relationship("Landowner", back_populates="village")
