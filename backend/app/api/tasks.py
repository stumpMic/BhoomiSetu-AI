from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.database import get_db
from app.models.task import DepartmentalTask
from app.models.project import Project
from app.models.acquisition_case import AcquisitionCase
from app.models.parcel import Parcel
from app.models.department import Department
from app.models.user import User
from app.schemas.task import TaskResponse, TaskCreate, TaskUpdate
from app.dependencies import get_current_user, require_roles
from app.services.risk_recalculation_service import RiskRecalculationService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/tasks", tags=["Departmental Tasks"])

def _format_task_response(t: DepartmentalTask) -> TaskResponse:
    today = date.today()
    is_overdue = (t.deadline < today and t.status != "Completed") or t.status == "Overdue"

    return TaskResponse(
        id=t.id,
        title=t.title,
        description=t.description,
        project_id=t.project_id,
        project_name=t.project.name if t.project else None,
        case_id=t.case_id,
        case_number=t.case.case_number if t.case else None,
        parcel_id=t.parcel_id,
        plot_number=t.parcel.plot_number if t.parcel else None,
        assigned_department_id=t.assigned_department_id,
        assigned_department_name=t.assigned_department.name if t.assigned_department else None,
        assigned_officer_id=t.assigned_officer_id,
        assigned_officer_name=t.assigned_officer.full_name if t.assigned_officer else None,
        priority=t.priority or "Medium",
        status=t.status,
        start_date=t.start_date,
        deadline=t.deadline,
        completed_at=t.completed_at,
        is_overdue=is_overdue,
        remarks=t.remarks,
        completion_evidence=t.completion_evidence,
        created_at=t.created_at
    )

@router.get("", response_model=List[TaskResponse])
def list_tasks(
    case_id: Optional[int] = None,
    department_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DepartmentalTask)
    if case_id:
        query = query.filter(DepartmentalTask.case_id == case_id)
    if department_id:
        query = query.filter(DepartmentalTask.assigned_department_id == department_id)
    if status_filter:
        query = query.filter(DepartmentalTask.status == status_filter)

    tasks = query.order_by(DepartmentalTask.deadline.asc()).all()
    return [_format_task_response(t) for t in tasks]

@router.get("/overdue", response_model=List[TaskResponse])
def get_overdue_tasks(db: Session = Depends(get_db)):
    today = date.today()
    tasks = db.query(DepartmentalTask).filter(
        DepartmentalTask.deadline < today,
        DepartmentalTask.status != "Completed"
    ).all()
    return [_format_task_response(t) for t in tasks]

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "land_acquisition_officer", "project_authority"]))
):
    task = DepartmentalTask(
        title=payload.title,
        description=payload.description,
        project_id=payload.project_id,
        case_id=payload.case_id,
        parcel_id=payload.parcel_id,
        assigned_department_id=payload.assigned_department_id,
        assigned_officer_id=payload.assigned_officer_id or current_user.id,
        priority=payload.priority or "Medium",
        status="To do",
        start_date=payload.start_date or date.today(),
        deadline=payload.deadline,
        remarks=payload.remarks
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Dispatch alert
    NotificationService.create_alert(
        db=db,
        title=f"New Task Assigned: {task.title}",
        message=f"Departmental task assigned to {task.assigned_department.name if task.assigned_department else 'Department'}. Deadline: {task.deadline}.",
        alert_type="task_overdue",
        severity="info",
        case_id=task.case_id,
        parcel_id=task.parcel_id
    )

    if task.case_id:
        RiskRecalculationService.recalculate_case_risk(db, task.case_id, trigger_reason=f"New Task Assigned: {task.title}")

    return _format_task_response(task)

@router.put("/{id}", response_model=TaskResponse)
def update_task(
    id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(DepartmentalTask).filter(DepartmentalTask.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.status:
        task.status = payload.status
        if payload.status == "Completed":
            task.completed_at = datetime.utcnow()
            task.is_overdue = False
    if payload.remarks:
        task.remarks = payload.remarks
    if payload.completion_evidence:
        task.completion_evidence = payload.completion_evidence

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)

    # Dynamic risk recalculation trigger
    if task.case_id:
        RiskRecalculationService.recalculate_case_risk(db, task.case_id, trigger_reason=f"Task '{task.title}' updated to {task.status}")

    return _format_task_response(task)
