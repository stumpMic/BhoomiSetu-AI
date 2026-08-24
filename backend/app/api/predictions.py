from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.acquisition_case import AcquisitionCase
from app.models.prediction import RiskPrediction, PredictionFactor
from app.schemas.prediction import PredictionResponse, PredictionHistoryResponse, PredictionHistoryItem, ContributingFactor, RecommendedAction
from app.services.risk_recalculation_service import RiskRecalculationService
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/predictions", tags=["Delay Predictions & AI"])

@router.post("/case/{case_id}", response_model=PredictionResponse)
def trigger_prediction(case_id: int, db: Session = Depends(get_db)):
    case = db.query(AcquisitionCase).filter(AcquisitionCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Acquisition case not found")

    updated_case = RiskRecalculationService.recalculate_case_risk(db, case_id, trigger_reason="Manual Officer Prediction Trigger")
    return get_latest_prediction(case_id, db)

@router.get("/case/{case_id}/latest", response_model=PredictionResponse)
def get_latest_prediction(case_id: int, db: Session = Depends(get_db)):
    case = db.query(AcquisitionCase).filter(AcquisitionCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Acquisition case not found")

    latest_pred = db.query(RiskPrediction).filter(RiskPrediction.case_id == case_id).order_by(RiskPrediction.prediction_time.desc()).first()

    factors = []
    if latest_pred and latest_pred.factors:
        for f in latest_pred.factors:
            factors.append(ContributingFactor(
                factor=f.factor_name,
                impact=float(f.impact_score),
                direction=f.direction,
                description=f.description or ""
            ))

    # Feature metrics for recommendations
    metrics = {
        "ownership_disputes_count": int(case.ownership_disputes_count or 0),
        "survey_completed_pct": float(case.survey_completed_pct or 0.0),
        "missing_doc_pct": float(case.missing_doc_pct or 0.0),
        "compensation_progress_pct": float(case.compensation_progress_pct or 0.0),
        "bank_verification_pct": float(case.bank_verification_pct or 0.0),
        "overdue_tasks_count": sum(1 for t in case.tasks if t.status == "Overdue" or (t.is_overdue and t.status != "Completed")),
        "open_grievances_count": len(case.grievances)
    }

    raw_recs = RecommendationService.generate_recommendations(metrics)
    recs = [RecommendedAction(**r) for r in raw_recs]

    return PredictionResponse(
        case_id=case.id,
        case_number=case.case_number,
        project_name=case.project.name if case.project else "",
        village_name=case.village.name if case.village else "",
        delay_probability=float(case.current_delay_probability or 0.0),
        risk_level=case.current_risk_level or "Low",
        predicted_delay_days=int(case.predicted_delay_days or 0),
        model_version=latest_pred.model_version if latest_pred else "v1.4.0-rf",
        prediction_time=latest_pred.prediction_time if latest_pred else case.updated_at,
        contributing_factors=factors,
        recommended_actions=recs,
        disclaimer="This prediction is decision-support information and must be reviewed by an authorised officer. It is not an automated legal decision."
    )

@router.get("/case/{case_id}/history", response_model=PredictionHistoryResponse)
def get_prediction_history(case_id: int, db: Session = Depends(get_db)):
    case = db.query(AcquisitionCase).filter(AcquisitionCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Acquisition case not found")

    preds = db.query(RiskPrediction).filter(RiskPrediction.case_id == case_id).order_by(RiskPrediction.prediction_time.desc()).all()
    history = [
        PredictionHistoryItem(
            id=p.id,
            delay_probability=float(p.delay_probability),
            risk_level=p.risk_level,
            predicted_delay_days=p.predicted_delay_days,
            trigger_reason=p.trigger_reason or "Recalculation",
            prediction_time=p.prediction_time
        ) for p in preds
    ]

    return PredictionHistoryResponse(case_id=case_id, history=history)
