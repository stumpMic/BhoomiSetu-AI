import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.models.user import User

logger = logging.getLogger("bhoomisetu.notifications")

class NotificationService:
    @staticmethod
    def create_alert(
        db: Session,
        title: str,
        message: str,
        alert_type: str,
        severity: str = "info",
        case_id: Optional[int] = None,
        parcel_id: Optional[int] = None,
        target_user_id: Optional[int] = None,
        target_role: Optional[str] = None,
        dispatch_sms: bool = True
    ) -> Alert:
        """
        Create an in-app alert and dispatch a mock SMS log.
        """
        alert = Alert(
            title=title,
            message=message,
            alert_type=alert_type,
            severity=severity,
            case_id=case_id,
            parcel_id=parcel_id,
            target_user_id=target_user_id,
            target_role=target_role,
            is_read=False,
            mock_sms_dispatched=dispatch_sms
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        if dispatch_sms:
            logger.info(f"[MOCK SMS GATEWAY] Dispatched SMS -> Alert ID: {alert.id} | Type: {alert_type} | Message: {message}")
            try:
                print(f"[MOCK SMS GATEWAY] Dispatched SMS -> {title}: {message}")
            except Exception:
                safe_str = f"[MOCK SMS GATEWAY] Dispatched SMS -> {title}: {message}".encode("ascii", errors="replace").decode("ascii")
                print(safe_str)

        return alert
