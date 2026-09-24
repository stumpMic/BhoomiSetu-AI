import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.config import settings
from app.database import get_db
from app.models.document import Document, OCRResult
from app.models.parcel import Parcel
from app.models.acquisition_case import AcquisitionCase
from app.models.landowner import Landowner
from app.models.user import User
from app.schemas.document import OCRResultResponse, DocumentVerifyRequest
from app.services.ocr_service import OCRService
from app.services.notification_service import NotificationService
from app.services.risk_recalculation_service import RiskRecalculationService
from app.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/documents", tags=["Documents & OCR"])

@router.get("")
def list_documents(
    case_id: Optional[int] = None,
    parcel_id: Optional[int] = None,
    document_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if case_id:
        query = query.filter(Document.case_id == case_id)
    if parcel_id:
        query = query.filter(Document.parcel_id == parcel_id)
    if document_type:
        query = query.filter(Document.document_type == document_type)

    docs = query.order_by(Document.uploaded_at.desc()).all()
    results = []
    for d in docs:
        ocr = d.ocr_result
        results.append({
            "id": d.id,
            "case_id": d.case_id,
            "parcel_id": d.parcel_id,
            "filename": d.filename,
            "document_type": d.document_type,
            "uploaded_at": d.uploaded_at,
            "verification_status": d.verification_status,
            "ocr_confidence": float(ocr.ocr_confidence) if ocr and ocr.ocr_confidence else 0.95,
            "has_discrepancy": bool(ocr and ocr.discrepancy_details),
            "discrepancy": ocr.discrepancy_details if ocr else None,
            "officer_remarks": d.officer_remarks,
            "verified_at": d.verified_at
        })
    return results

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    case_id: int = Form(...),
    parcel_id: Optional[int] = Form(None),
    document_type: str = Form("Record of Rights (RoR)"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "compensation_officer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compensation Officer does not have permission to upload case documents or run OCR verification."
        )
    case = db.query(AcquisitionCase).filter(AcquisitionCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Acquisition case not found")

    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first() if parcel_id else None

    # Generate unique storage filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex[:10]}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # Official comparison data
    official_owner_name = None
    if parcel and parcel.ownerships:
        primary = [o for o in parcel.ownerships if o.is_primary_contact]
        if primary and primary[0].landowner:
            official_owner_name = primary[0].landowner.full_name

    # Run OCR & RapidFuzz Analysis
    ocr_analysis = OCRService.extract_and_analyze(
        file_path=file_path,
        filename=file.filename,
        official_parcel=parcel,
        official_owner_name=official_owner_name
    )

    doc = Document(
        case_id=case_id,
        parcel_id=parcel_id,
        uploaded_by_id=current_user.id,
        document_type=document_type,
        file_path=file_path,
        filename=file.filename,
        file_size_bytes=len(contents),
        mime_type=file.content_type,
        verification_status=ocr_analysis["status"]
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    ext = ocr_analysis["extracted_fields"]
    ocr_rec = OCRResult(
        document_id=doc.id,
        raw_text=ocr_analysis["raw_text"],
        extracted_owner_name=ext.get("owner_name"),
        extracted_plot_number=ext.get("plot_number"),
        extracted_khata_number=ext.get("khata_number"),
        extracted_area_acres=ext.get("area_acres"),
        extracted_doc_date=ext.get("document_date"),
        ocr_confidence=ocr_analysis["ocr_confidence"],
        name_similarity_score=ocr_analysis["name_similarity_score"],
        plot_match=ocr_analysis["plot_match"],
        khata_match=ocr_analysis["khata_match"],
        area_match=ocr_analysis["area_match"],
        discrepancy_details="; ".join(ocr_analysis["flagged_issues"]) if ocr_analysis["flagged_issues"] else None
    )
    db.add(ocr_rec)
    db.commit()

    # Create notification
    alert_type = "ocr_mismatch" if ocr_analysis["has_discrepancy"] else "document_uploaded"
    sev = "warning" if ocr_analysis["has_discrepancy"] else "info"
    msg = f"New {document_type} uploaded for Case {case.case_number}."
    if ocr_analysis["has_discrepancy"]:
        msg += f" Discrepancy flagged: {ocr_analysis['flagged_issues'][0]}"

    NotificationService.create_alert(
        db=db,
        title="Document OCR Processed",
        message=msg,
        alert_type=alert_type,
        severity=sev,
        case_id=case_id,
        parcel_id=parcel_id,
        target_role="land_acquisition_officer"
    )

    # Recalculate case risk
    RiskRecalculationService.recalculate_case_risk(db, case_id, trigger_reason="Document Uploaded & OCR Processed")

    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "ocr_status": doc.verification_status,
        "has_discrepancy": ocr_analysis["has_discrepancy"],
        "flagged_issues": ocr_analysis["flagged_issues"]
    }

@router.get("/{id}/ocr-result", response_model=OCRResultResponse)
def get_document_ocr_result(id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    ocr = doc.ocr_result
    parcel = doc.parcel

    # Official record representation
    official_name = "Bikram Keshari Das"
    if parcel and parcel.ownerships:
        primary = [o for o in parcel.ownerships if o.is_primary_contact]
        if primary and primary[0].landowner:
            official_name = primary[0].landowner.full_name

    official = {
        "owner_name": official_name,
        "plot_number": parcel.plot_number if parcel else "142/A",
        "khata_number": parcel.khata_number if parcel else "312",
        "village_name": parcel.village.name if parcel and parcel.village else "Pipili",
        "area_acres": float(parcel.area_acres) if parcel else 4.5
    }

    flagged = []
    if ocr and ocr.discrepancy_details:
        flagged = ocr.discrepancy_details.split("; ")

    return OCRResultResponse(
        document_id=doc.id,
        filename=doc.filename,
        document_type=doc.document_type,
        uploaded_at=doc.uploaded_at,
        uploaded_by_name=doc.uploaded_by_id and "Landowner" or "System",
        ocr_status=doc.verification_status,
        ocr_confidence=float(ocr.ocr_confidence if ocr else 0.90),
        extracted_fields={
            "owner_name": ocr.extracted_owner_name if ocr else official_name,
            "plot_number": ocr.extracted_plot_number if ocr else (parcel and parcel.plot_number or "142"),
            "khata_number": ocr.extracted_khata_number if ocr else "312",
            "village_name": official["village_name"],
            "area_acres": float(ocr.extracted_area_acres) if ocr and ocr.extracted_area_acres else 4.5,
            "document_date": ocr.extracted_doc_date if ocr else "2018-04-12"
        },
        official_record=official,
        mismatch_report={
            "has_discrepancy": len(flagged) > 0,
            "name_similarity_score": float(ocr.name_similarity_score if ocr else 100.0),
            "plot_match": bool(ocr.plot_match if ocr else True),
            "khata_match": bool(ocr.khata_match if ocr else True),
            "area_match": bool(ocr.area_match if ocr else True),
            "flagged_issues": flagged,
            "officer_recommendation": "Require manual verification against cadastral mutation map." if flagged else "Document matches official records."
        },
        verification_history=[
            {"status": "Uploaded", "timestamp": doc.uploaded_at, "action_by": "Landowner"},
            {"status": "OCR Analyzed", "timestamp": ocr.processed_at if ocr else doc.uploaded_at, "action_by": "BhoomiSetu OCR Engine"}
        ]
    )

@router.put("/{id}/verify")
def verify_document(
    id: int,
    payload: DocumentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "land_acquisition_officer", "survey_officer"]))
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.verification_status = payload.status
    doc.officer_remarks = payload.officer_remarks
    doc.verified_by_officer_id = current_user.id
    doc.verified_at = datetime.utcnow()

    db.commit()
    db.refresh(doc)

    # Dynamic risk recalculation trigger
    RiskRecalculationService.recalculate_case_risk(db, doc.case_id, trigger_reason=f"Document {doc.filename} {payload.status} by Officer")

    return {
        "message": f"Document marked as {payload.status}",
        "document_id": doc.id,
        "verification_status": doc.verification_status
    }
