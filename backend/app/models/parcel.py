from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("acquisition_cases.id"), nullable=False, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False, index=True)
    plot_number = Column(String(40), nullable=False, index=True)
    khata_number = Column(String(40), nullable=False, index=True)
    area_acres = Column(Numeric(8, 3), nullable=False)
    land_type = Column(String(60), default="Agricultural")
    valuation_per_acre_inr = Column(Numeric(12, 2), default=1000000.0)
    total_valuation_inr = Column(Numeric(14, 2), default=0.0)
    risk_level = Column(String(20), default="Low", index=True)
    risk_color = Column(String(10), default="#10B981")
    survey_status = Column(String(40), default="Pending")
    acquisition_status = Column(String(40), default="Notification")
    geometry_geojson = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("AcquisitionCase", back_populates="parcels")
    village = relationship("Village", back_populates="parcels")
    ownerships = relationship("ParcelOwnership", back_populates="parcel", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="parcel")
    compensations = relationship("Compensation", back_populates="parcel", cascade="all, delete-orphan")
    tasks = relationship("DepartmentalTask", back_populates="parcel")


class ParcelOwnership(Base):
    __tablename__ = "parcel_ownerships"

    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("parcels.id"), nullable=False, index=True)
    landowner_id = Column(Integer, ForeignKey("landowners.id"), nullable=False, index=True)
    ownership_share_pct = Column(Numeric(5, 2), default=100.0)
    is_primary_contact = Column(Boolean, default=True)
    dispute_flag = Column(Boolean, default=False)
    dispute_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    parcel = relationship("Parcel", back_populates="ownerships")
    landowner = relationship("Landowner", back_populates="ownerships")
