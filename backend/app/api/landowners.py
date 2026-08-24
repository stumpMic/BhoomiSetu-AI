from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.landowner import Landowner
from app.models.parcel import Parcel, ParcelOwnership
from app.models.compensation import Compensation
from app.models.document import Document
from app.models.grievance import Grievance
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/landowners", tags=["Landowners"])

@router.get("/{id}")
def get_landowner_profile(id: int, db: Session = Depends(get_db)):
    lo = db.query(Landowner).filter(Landowner.id == id).first()
    if not lo:
        raise HTTPException(status_code=404, detail="Landowner not found")

    # Get linked parcels
    ownerships = db.query(ParcelOwnership).filter(ParcelOwnership.landowner_id == id).all()
    parcels_data = []
    for o in ownerships:
        p = o.parcel
        comp = db.query(Compensation).filter(Compensation.parcel_id == p.id, Compensation.landowner_id == id).first()
        parcels_data.append({
            "parcel_id": p.id,
            "plot_number": p.plot_number,
            "khata_number": p.khata_number,
            "village_name": p.village.name if p.village else "Pipili",
            "area_acres": float(p.area_acres),
            "land_type": p.land_type,
            "share_pct": float(o.ownership_share_pct),
            "risk_level": p.risk_level,
            "risk_color": p.risk_color,
            "case_id": p.case_id,
            "case_number": p.case.case_number if p.case else "",
            "project_name": p.case.project.name if p.case and p.case.project else "",
            "compensation_stage": comp.current_stage if comp else "Land valuation pending",
            "compensation_amount": float(comp.landowner_share_inr) if comp else float(p.total_valuation_inr or 0.0),
            "dispute_flag": o.dispute_flag,
            "dispute_remarks": o.dispute_remarks
        })

    # Grievances
    grievances = db.query(Grievance).filter(Grievance.landowner_id == id).all()
    grievances_data = [{
        "id": g.id,
        "grievance_number": g.grievance_number,
        "category": g.category,
        "subject": g.subject,
        "status": g.status,
        "submitted_at": g.submitted_at
    } for g in grievances]

    return {
        "id": lo.id,
        "full_name": lo.full_name,
        "father_or_husband_name": lo.father_or_husband_name,
        "gender": lo.gender,
        "phone": lo.phone,
        "masked_aadhaar": lo.masked_aadhaar,
        "address": lo.address,
        "village_id": lo.village_id,
        "village_name": lo.village.name if lo.village else None,
        "bank_account_masked": lo.bank_account_masked,
        "bank_ifsc": lo.bank_ifsc,
        "bank_name": lo.bank_name,
        "bank_verification_status": lo.bank_verification_status,
        "parcels": parcels_data,
        "grievances": grievances_data
    }
