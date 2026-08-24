from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from app.database import get_db
from app.models.parcel import Parcel, ParcelOwnership
from app.models.acquisition_case import AcquisitionCase
from app.models.village import Village
from app.models.compensation import Compensation
from app.models.landowner import Landowner
from app.schemas.parcel import (
    ParcelResponse, ParcelFeatureCollection, ParcelFeature,
    ParcelFeatureProperties, GeoJSONGeometry, OwnerShare
)

router = APIRouter(prefix="/parcels", tags=["Parcels & GIS"])

def _build_parcel_owners(parcel_id: int, db: Session) -> List[OwnerShare]:
    ownerships = db.query(ParcelOwnership).filter(ParcelOwnership.parcel_id == parcel_id).all()
    owners = []
    for o in ownerships:
        lo = db.query(Landowner).filter(Landowner.id == o.landowner_id).first()
        if lo:
            owners.append(OwnerShare(
                id=lo.id,
                name=lo.full_name,
                share_pct=float(o.ownership_share_pct),
                phone=lo.phone,
                masked_aadhaar=lo.masked_aadhaar,
                bank_verification_status=lo.bank_verification_status
            ))
    return owners

@router.get("", response_model=List[ParcelResponse])
def list_parcels(
    case_id: Optional[int] = None,
    village_id: Optional[int] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Parcel)
    if case_id:
        query = query.filter(Parcel.case_id == case_id)
    if village_id:
        query = query.filter(Parcel.village_id == village_id)
    if risk_level:
        query = query.filter(Parcel.risk_level == risk_level)
    if search:
        query = query.filter((Parcel.plot_number.ilike(f"%{search}%")) | (Parcel.khata_number.ilike(f"%{search}%")))

    parcels = query.all()
    results = []

    for p in parcels:
        case = p.case
        village = p.village
        comp = db.query(Compensation).filter(Compensation.parcel_id == p.id).first()
        owners = _build_parcel_owners(p.id, db)
        pending_tasks = len([t for t in p.tasks if t.status != "Completed"])

        results.append(ParcelResponse(
            id=p.id,
            case_id=p.case_id,
            case_number=case.case_number if case else None,
            project_id=case.project_id if case else None,
            project_name=case.project.name if case and case.project else None,
            village_id=p.village_id,
            village_name=village.name if village else None,
            district=village.district if village else None,
            plot_number=p.plot_number,
            khata_number=p.khata_number,
            area_acres=float(p.area_acres),
            land_type=p.land_type,
            valuation_per_acre_inr=float(p.valuation_per_acre_inr or 0.0),
            total_valuation_inr=float(p.total_valuation_inr or 0.0),
            risk_level=p.risk_level or "Low",
            risk_color=p.risk_color or "#10B981",
            survey_status=p.survey_status or "Pending",
            acquisition_status=p.acquisition_status or "Notification",
            compensation_stage=comp.current_stage if comp else "Land valuation pending",
            compensation_amount=float(comp.total_award_inr) if comp else float(p.total_valuation_inr or 0.0),
            owners=owners,
            pending_tasks_count=pending_tasks
        ))
    return results

@router.get("/map", response_model=ParcelFeatureCollection)
def get_parcels_map(
    project_id: Optional[int] = None,
    village_id: Optional[int] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Parcel)
    if village_id:
        query = query.filter(Parcel.village_id == village_id)
    if risk_level:
        query = query.filter(Parcel.risk_level == risk_level)
    if search:
        query = query.filter((Parcel.plot_number.ilike(f"%{search}%")) | (Parcel.khata_number.ilike(f"%{search}%")))

    parcels = query.all()
    features = []

    # Base coordinates for Pipili area demo polygons
    base_lat = 20.1228
    base_lng = 85.8335

    for idx, p in enumerate(parcels):
        case = p.case
        village = p.village
        if project_id and case and case.project_id != project_id:
            continue

        comp = db.query(Compensation).filter(Compensation.parcel_id == p.id).first()
        owners = _build_parcel_owners(p.id, db)
        pending_tasks = len([t for t in p.tasks if t.status != "Completed"])

        # Construct spatial coordinates grid around demo village
        row = idx // 8
        col = idx % 8
        d_lat = row * 0.0032
        d_lng = col * 0.0035

        # Custom polygon coordinates
        poly_coords = [
            [
                [round(base_lng + d_lng, 6), round(base_lat + d_lat, 6)],
                [round(base_lng + d_lng + 0.0030, 6), round(base_lat + d_lat, 6)],
                [round(base_lng + d_lng + 0.0028, 6), round(base_lat + d_lat + 0.0028, 6)],
                [round(base_lng + d_lng, 6), round(base_lat + d_lat + 0.0028, 6)],
                [round(base_lng + d_lng, 6), round(base_lat + d_lat, 6)]
            ]
        ]

        feature = ParcelFeature(
            type="Feature",
            id=p.id,
            geometry=GeoJSONGeometry(
                type="Polygon",
                coordinates=poly_coords
            ),
            properties=ParcelFeatureProperties(
                id=p.id,
                plot_number=p.plot_number,
                khata_number=p.khata_number,
                village_name=village.name if village else "Pipili",
                district=village.district if village else "Khurda",
                area_acres=float(p.area_acres),
                land_type=p.land_type,
                risk_level=p.risk_level or "Low",
                risk_color=p.risk_color or "#10B981",
                delay_probability=float(case.current_delay_probability if case else 0.2),
                case_id=p.case_id,
                case_number=case.case_number if case else "",
                project_name=case.project.name if case and case.project else "",
                compensation_stage=comp.current_stage if comp else "Land valuation pending",
                compensation_amount=float(comp.total_award_inr) if comp else float(p.total_valuation_inr or 0.0),
                owners=owners,
                pending_tasks_count=pending_tasks
            )
        )
        features.append(feature)

    return ParcelFeatureCollection(type="FeatureCollection", features=features)

@router.get("/{id}", response_model=ParcelResponse)
def get_parcel(id: int, db: Session = Depends(get_db)):
    p = db.query(Parcel).filter(Parcel.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Parcel not found")

    case = p.case
    village = p.village
    comp = db.query(Compensation).filter(Compensation.parcel_id == p.id).first()
    owners = _build_parcel_owners(p.id, db)
    pending_tasks = len([t for t in p.tasks if t.status != "Completed"])

    return ParcelResponse(
        id=p.id,
        case_id=p.case_id,
        case_number=case.case_number if case else None,
        project_id=case.project_id if case else None,
        project_name=case.project.name if case and case.project else None,
        village_id=p.village_id,
        village_name=village.name if village else None,
        district=village.district if village else None,
        plot_number=p.plot_number,
        khata_number=p.khata_number,
        area_acres=float(p.area_acres),
        land_type=p.land_type,
        valuation_per_acre_inr=float(p.valuation_per_acre_inr or 0.0),
        total_valuation_inr=float(p.total_valuation_inr or 0.0),
        risk_level=p.risk_level or "Low",
        risk_color=p.risk_color or "#10B981",
        survey_status=p.survey_status or "Pending",
        acquisition_status=p.acquisition_status or "Notification",
        compensation_stage=comp.current_stage if comp else "Land valuation pending",
        compensation_amount=float(comp.total_award_inr) if comp else float(p.total_valuation_inr or 0.0),
        owners=owners,
        pending_tasks_count=pending_tasks
    )
