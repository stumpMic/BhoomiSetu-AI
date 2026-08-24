from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("acquisition_cases.id"), nullable=False, index=True)
    parcel_id = Column(Integer, ForeignKey("parcels.id"), nullable=True, index=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    document_type = Column(String(80), nullable=False) # Record of Rights (RoR), Aadhaar Consent, Bank Passbook, etc.
    file_path = Column(String(255), nullable=False)
    filename = Column(String(150), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(60), nullable=True)
    verification_status = Column(String(40), default="Pending Processing") # Pending Processing, Verified, Possible Mismatch, Manual Review Required, Rejected
    officer_remarks = Column(Text, nullable=True)
    verified_by_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    case = relationship("AcquisitionCase", back_populates="documents")
    parcel = relationship("Parcel", back_populates="documents")
    ocr_result = relationship("OCRResult", back_populates="document", uselist=False, cascade="all, delete-orphan")


class OCRResult(Base):
    __tablename__ = "ocr_results"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), unique=True, nullable=False)
    raw_text = Column(Text, nullable=True)
    extracted_owner_name = Column(String(150), nullable=True)
    extracted_plot_number = Column(String(40), nullable=True)
    extracted_khata_number = Column(String(40), nullable=True)
    extracted_area_acres = Column(Numeric(8, 3), nullable=True)
    extracted_doc_date = Column(String(40), nullable=True)
    ocr_confidence = Column(Numeric(4, 3), default=0.0)
    name_similarity_score = Column(Numeric(5, 2), default=0.0)
    plot_match = Column(Boolean, default=True)
    khata_match = Column(Boolean, default=True)
    area_match = Column(Boolean, default=True)
    discrepancy_details = Column(Text, nullable=True)
    processed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="ocr_result")
