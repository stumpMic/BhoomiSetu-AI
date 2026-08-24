from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.project import Project
from app.models.acquisition_case import AcquisitionCase
from app.models.parcel import Parcel
from app.schemas.project import ProjectResponse, ProjectCreate
from app.dependencies import get_current_user, require_roles
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def list_projects(status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Project)
    if status_filter:
        query = query.filter(Project.status == status_filter)
    projects = query.all()

    result = []
    for proj in projects:
        cases = db.query(AcquisitionCase).filter(AcquisitionCase.project_id == proj.id).all()
        cases_count = len(cases)
        high_risk_count = sum(1 for c in cases if c.current_risk_level == "High")

        case_ids = [c.id for c in cases]
        parcels = db.query(Parcel).filter(Parcel.case_id.in_(case_ids)).all() if case_ids else []
        acquired_area = sum(float(p.area_acres) for p in parcels if p.acquisition_status in ["Possession", "Compensation"])

        result.append(ProjectResponse(
            id=proj.id,
            code=proj.code,
            name=proj.name,
            description=proj.description,
            executing_agency=proj.executing_agency,
            project_authority_id=proj.project_authority_id,
            state=proj.state,
            districts=proj.districts,
            target_start_date=proj.target_start_date,
            target_end_date=proj.target_end_date,
            estimated_budget_cr=float(proj.estimated_budget_cr or 0.0),
            total_area_required_acres=float(proj.total_area_required_acres or 0.0),
            status=proj.status,
            cases_count=cases_count,
            acquired_area_acres=round(acquired_area, 1),
            high_risk_cases_count=high_risk_count,
            created_at=proj.created_at
        ))
    return result

@router.get("/{id}", response_model=ProjectResponse)
def get_project(id: int, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    cases = db.query(AcquisitionCase).filter(AcquisitionCase.project_id == proj.id).all()
    cases_count = len(cases)
    high_risk_count = sum(1 for c in cases if c.current_risk_level == "High")

    case_ids = [c.id for c in cases]
    parcels = db.query(Parcel).filter(Parcel.case_id.in_(case_ids)).all() if case_ids else []
    acquired_area = sum(float(p.area_acres) for p in parcels if p.acquisition_status in ["Possession", "Compensation"])

    return ProjectResponse(
        id=proj.id,
        code=proj.code,
        name=proj.name,
        description=proj.description,
        executing_agency=proj.executing_agency,
        project_authority_id=proj.project_authority_id,
        state=proj.state,
        districts=proj.districts,
        target_start_date=proj.target_start_date,
        target_end_date=proj.target_end_date,
        estimated_budget_cr=float(proj.estimated_budget_cr or 0.0),
        total_area_required_acres=float(proj.total_area_required_acres or 0.0),
        status=proj.status,
        cases_count=cases_count,
        acquired_area_acres=round(acquired_area, 1),
        high_risk_cases_count=high_risk_count,
        created_at=proj.created_at
    )

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "project_authority"]))
):
    existing = db.query(Project).filter(Project.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project code already exists")

    proj = Project(**payload.model_dump())
    db.add(proj)
    db.commit()
    db.refresh(proj)

    return ProjectResponse(
        id=proj.id,
        code=proj.code,
        name=proj.name,
        description=proj.description,
        executing_agency=proj.executing_agency,
        project_authority_id=proj.project_authority_id,
        state=proj.state,
        districts=proj.districts,
        target_start_date=proj.target_start_date,
        target_end_date=proj.target_end_date,
        estimated_budget_cr=float(proj.estimated_budget_cr or 0.0),
        total_area_required_acres=float(proj.total_area_required_acres or 0.0),
        status=proj.status,
        cases_count=0,
        acquired_area_acres=0.0,
        high_risk_cases_count=0,
        created_at=proj.created_at
    )
