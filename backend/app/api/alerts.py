from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertResponse
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/alerts", tags=["Alerts & Notifications"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    unread_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if unread_only:
        query = query.filter(Alert.is_read == False)
    alerts = query.order_by(Alert.created_at.desc()).limit(50).all()
    return alerts

@router.put("/{id}/read")
def mark_alert_as_read(id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"message": "Alert marked as read", "id": id}

@router.put("/read-all")
def mark_all_alerts_read(db: Session = Depends(get_db)):
    db.query(Alert).filter(Alert.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All alerts marked as read"}
