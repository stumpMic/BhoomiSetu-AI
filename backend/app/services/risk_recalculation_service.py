from datetime import datetime
from sqlalchemy.orm import Session
from app.models.acquisition_case import AcquisitionCase
from app.models.parcel import Parcel, ParcelOwnership
from app.models.document import Document
from app.models.task import DepartmentalTask
from app.models.compensation import Compensation
from app.models.grievance import Grievance
from app.models.prediction import RiskPrediction, PredictionFactor
from app.models.activity_log import ActivityLog
from app.services.prediction_service import PredictionService
from app.services.notification_service import NotificationService

class RiskRecalculationService:
    @staticmethod
    def recalculate_case_risk(db: Session, case_id: int, trigger_reason: str = "Case Record Update") -> AcquisitionCase:
        """
        Dynamically recalculates risk for an acquisition case, updates parcel risk colors,
        stores prediction history with explainability factors, and dispatches alerts.
        """
        case = db.query(AcquisitionCase).filter(AcquisitionCase.id == case_id).first()
        if not case:
            return None

        previous_prob = float(case.current_delay_probability or 0.0)
        previous_risk = case.current_risk_level

        # 1. Fetch live metrics from database
        parcels = db.query(Parcel).filter(Parcel.case_id == case_id).all()
        total_parcels = len(parcels) or 1
        total_area = sum(float(p.area_acres) for p in parcels) or 10.0

        parcel_ids = [p.id for p in parcels]
        
        # Ownership disputes
        ownerships = db.query(ParcelOwnership).filter(ParcelOwnership.parcel_id.in_(parcel_ids)).all() if parcel_ids else []
        dispute_count = sum(1 for o in ownerships if o.dispute_flag)

        # Documents & Mismatches
        docs = db.query(Document).filter(Document.case_id == case_id).all()
        total_docs = len(docs)
        unverified_docs = sum(1 for d in docs if d.verification_status in ["Pending Processing", "Possible Mismatch", "Manual Review Required"])
        missing_doc_pct = (unverified_docs / max(total_docs, 1)) * 100.0 if total_docs > 0 else 25.0

        # Surveys
        completed_surveys = sum(1 for p in parcels if p.survey_status == "Completed")
        survey_pct = (completed_surveys / total_parcels) * 100.0

        # Tasks & Overdue
        tasks = db.query(DepartmentalTask).filter(DepartmentalTask.case_id == case_id).all()
        overdue_tasks = sum(1 for t in tasks if t.status == "Overdue" or (t.is_overdue and t.status != "Completed"))

        # Compensations
        comps = db.query(Compensation).filter(Compensation.case_id == case_id).all()
        total_comps = len(comps) or 1
        comp_progress_sum = sum(min(c.stage_index * 11.1, 100.0) for c in comps)
        comp_progress_pct = comp_progress_sum / total_comps
        
        bank_verified_count = sum(1 for c in comps if c.stage_index >= 7)
        bank_verif_pct = (bank_verified_count / total_comps) * 100.0

        # Grievances
        grievances = db.query(Grievance).filter(Grievance.case_id == case_id).all()
        open_grievances = sum(1 for g in grievances if g.status != "Resolved")

        # 2. Build feature dictionary
        features = {
            "total_parcels": total_parcels,
            "total_landowners": len(ownerships) or 1,
            "total_land_area": total_area,
            "missing_doc_pct": missing_doc_pct,
            "survey_completed_pct": survey_pct,
            "ownership_disputes_count": dispute_count,
            "court_cases_count": int(case.court_cases_count or 0),
            "pending_approvals_count": int(case.pending_approvals_count or 0),
            "compensation_progress_pct": comp_progress_pct,
            "bank_verification_pct": bank_verif_pct,
            "open_grievances_count": open_grievances,
            "avg_dept_response_days": 14.0,
            "environmental_clearance": bool(case.environmental_clearance),
            "rehabilitation_required": bool(case.rehabilitation_required),
            "district_delay_rate": 38.0,
            "overdue_tasks_count": overdue_tasks,
            "days_remaining": 90
        }

        # 3. Compute Prediction
        pred_result = PredictionService.predict(features)
        new_prob = pred_result["delay_probability"]
        new_risk = pred_result["risk_level"]
        new_days = pred_result["predicted_delay_days"]

        # 4. Update Case Entity
        case.current_delay_probability = new_prob
        case.current_risk_level = new_risk
        case.predicted_delay_days = new_days
        case.missing_doc_pct = missing_doc_pct
        case.survey_completed_pct = survey_pct
        case.ownership_disputes_count = dispute_count
        case.compensation_progress_pct = comp_progress_pct
        case.bank_verification_pct = bank_verif_pct
        case.updated_at = datetime.utcnow()

        # 5. Update Parcel Risk Levels & Colors
        color_map = {
            "Low": "#10B981",
            "Medium": "#F59E0B",
            "High": "#EF4444"
        }
        for p in parcels:
            if p.acquisition_status == "Possession":
                p.risk_level = "Completed"
                p.risk_color = "#3B82F6"
            elif p.survey_status == "Pending" and new_risk == "High":
                p.risk_level = "High"
                p.risk_color = "#EF4444"
            else:
                p.risk_level = new_risk
                p.risk_color = color_map.get(new_risk, "#10B981")

        # 6. Save RiskPrediction Record
        prediction_record = RiskPrediction(
            case_id=case_id,
            delay_probability=new_prob,
            risk_level=new_risk,
            predicted_delay_days=new_days,
            model_version=pred_result.get("model_version", "v1.4.0-rf"),
            trigger_reason=trigger_reason,
            prediction_time=datetime.utcnow()
        )
        db.add(prediction_record)
        db.flush()

        # Save contributing factors
        for factor in pred_result.get("contributing_factors", []):
            pf = PredictionFactor(
                prediction_id=prediction_record.id,
                factor_name=factor["factor"],
                impact_score=factor["impact"],
                direction=factor["direction"],
                description=factor["description"]
            )
            db.add(pf)

        # 7. Discrepancy / Risk Shift Alert
        if abs(new_prob - previous_prob) >= 0.12 or new_risk != previous_risk:
            if new_prob > previous_prob:
                NotificationService.create_alert(
                    db=db,
                    title=f"Risk Escalation: Case {case.case_number}",
                    message=f"Delay risk increased from {int(previous_prob*100)}% to {int(new_prob*100)}% ({new_risk} Risk). Delay estimated at +{new_days} days.",
                    alert_type="risk_escalation",
                    severity="critical" if new_risk == "High" else "warning",
                    case_id=case_id,
                    target_role="land_acquisition_officer"
                )
            else:
                NotificationService.create_alert(
                    db=db,
                    title=f"Risk Mitigated: Case {case.case_number}",
                    message=f"Delay risk dropped from {int(previous_prob*100)}% to {int(new_prob*100)}% ({new_risk} Risk) following resolution of blockers.",
                    alert_type="compensation_updated",
                    severity="success",
                    case_id=case_id,
                    target_role="land_acquisition_officer"
                )

        # 8. Activity Log
        log = ActivityLog(
            action="RISK_RECALCULATION",
            entity_type="AcquisitionCase",
            entity_id=case_id,
            details=f"Recalculated risk: {new_risk} ({int(new_prob*100)}%, +{new_days}d). Trigger: {trigger_reason}"
        )
        db.add(log)
        db.commit()
        db.refresh(case)

        return case
