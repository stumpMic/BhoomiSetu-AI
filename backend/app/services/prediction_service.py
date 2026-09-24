import os
import joblib
import numpy as np
from typing import Dict, Any, List, Tuple
from app.config import settings
from app.services.recommendation_service import RecommendationService

class PredictionService:
    _classifier = None
    _regressor = None
    _feature_columns = None

    @classmethod
    def load_models(cls):
        """Lazy load exported ML models from disk"""
        if cls._classifier is None:
            clf_path = os.path.join(settings.ML_MODEL_PATH, "delay_classifier.pkl")
            reg_path = os.path.join(settings.ML_MODEL_PATH, "delay_regressor.pkl")
            if os.path.exists(clf_path) and os.path.exists(reg_path):
                try:
                    cls._classifier = joblib.load(clf_path)
                    cls._regressor = joblib.load(reg_path)
                except Exception as e:
                    print(f"Warning: Failed loading ML models: {e}. Using deterministic fallback.")
                    cls._classifier = None
                    cls._regressor = None

    @classmethod
    def predict(cls, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run inference using trained RandomForest models or deterministic rule-based fallback.
        """
        cls.load_models()

        # Extract features
        missing_doc = float(features.get("missing_doc_pct", 0.0))
        survey_done = float(features.get("survey_completed_pct", 100.0))
        disputes = int(features.get("ownership_disputes_count", 0))
        court_cases = int(features.get("court_cases_count", 0))
        pending_approvals = int(features.get("pending_approvals_count", 0))
        comp_progress = float(features.get("compensation_progress_pct", 100.0))
        bank_verif = float(features.get("bank_verification_pct", 100.0))
        overdue_tasks = int(features.get("overdue_tasks_count", 0))
        env_clearance = 1 if features.get("environmental_clearance", True) else 0
        rehab_req = 1 if features.get("rehabilitation_required", False) else 0
        district_delay = float(features.get("district_delay_rate", 35.0))

        # 1. Deterministic Rule-Based Base Calculation
        score = 0.12  # baseline
        score += (missing_doc / 100.0) * 0.25
        score += ((100.0 - survey_done) / 100.0) * 0.20
        score += min(disputes * 0.15, 0.35)
        score += min(court_cases * 0.18, 0.36)
        score += min(pending_approvals * 0.06, 0.18)
        score += ((100.0 - comp_progress) / 100.0) * 0.15
        score += ((100.0 - bank_verif) / 100.0) * 0.10
        score += min(overdue_tasks * 0.06, 0.18)
        if not env_clearance:
            score += 0.15
        if rehab_req:
            score += 0.10
        score += (district_delay / 100.0) * 0.08

        # Mitigating deductions
        if survey_done >= 90.0:
            score -= 0.10
        if missing_doc == 0.0:
            score -= 0.08
        if comp_progress >= 70.0:
            score -= 0.10
        if env_clearance:
            score -= 0.05

        delay_probability = float(np.clip(score, 0.05, 0.95))
        delay_days = int(delay_probability * 160 + overdue_tasks * 12 + disputes * 25)

        # If trained classifier is available, blend with ML model prediction
        if cls._classifier is not None and cls._regressor is not None:
            try:
                feature_vector = np.array([[
                    features.get("total_parcels", 5),
                    features.get("total_landowners", 4),
                    features.get("total_land_area", 15.0),
                    missing_doc,
                    survey_done,
                    disputes,
                    court_cases,
                    pending_approvals,
                    comp_progress,
                    bank_verif,
                    features.get("open_grievances_count", 1),
                    features.get("avg_dept_response_days", 14.0),
                    env_clearance,
                    rehab_req,
                    district_delay,
                    overdue_tasks,
                    features.get("days_remaining", 90)
                ]])
                ml_prob = float(cls._classifier.predict_proba(feature_vector)[0][1])
                ml_days = int(cls._regressor.predict(feature_vector)[0])
                delay_probability = float(np.clip(0.6 * ml_prob + 0.4 * score, 0.05, 0.96))
                delay_days = max(int(0.6 * ml_days + 0.4 * delay_days), 0)
            except Exception as e:
                print(f"Inference blend note: {e}")

        # Risk level classification
        if delay_probability < 0.40:
            risk_level = "Low"
        elif delay_probability < 0.70:
            risk_level = "Medium"
        else:
            risk_level = "High"

        # Dynamic Urgency Classification based on days remaining & target deadline
        days_rem = int(features.get("days_remaining", 90))
        if days_rem < 30 or delay_probability >= 0.75:
            urgency_level = "Critical"
        elif days_rem < 60 or delay_probability >= 0.50:
            urgency_level = "High"
        else:
            urgency_level = "Normal"

        # Stage-wise Delay Forecasting (LARR 5-Stage Breakdown)
        # 1. Joint Cadastral Survey Stage
        stage1_delay = int(max(0, ((100.0 - survey_done) / 100.0) * (delay_days * 0.35) + overdue_tasks * 8))
        stage1_status = "Critical Blocked" if survey_done < 50 else ("Delayed" if survey_done < 80 else "On-Track")

        # 2. Objections & Hearings Stage
        stage2_delay = int(max(0, (disputes * 18 + court_cases * 25)))
        stage2_status = "Critical Blocked" if court_cases > 0 or disputes >= 3 else ("Delayed" if disputes > 0 else "On-Track")

        # 3. Document Verification Stage
        stage3_delay = int(max(0, (missing_doc / 100.0) * (delay_days * 0.25)))
        stage3_status = "Delayed" if missing_doc > 15 else "On-Track"

        # 4. Compensation & Award Stage
        stage4_delay = int(max(0, ((100.0 - comp_progress) / 100.0) * (delay_days * 0.25) + ((100.0 - bank_verif) / 100.0) * 12))
        stage4_status = "Critical Blocked" if comp_progress < 30 else ("Delayed" if comp_progress < 70 else "On-Track")

        # 5. Possession & Handover Stage
        stage5_delay = int(max(0, (0 if env_clearance else 25) + (15 if rehab_req else 0) + pending_approvals * 10))
        stage5_status = "Delayed" if not env_clearance or pending_approvals > 1 else "On-Track"

        total_stage_delay = max(stage1_delay + stage2_delay + stage3_delay + stage4_delay + stage5_delay, 1)

        stage_forecasts = [
            {
                "stage_id": 1,
                "stage_name": "Joint Cadastral Survey & Demarcation",
                "predicted_delay_days": stage1_delay,
                "risk_contribution_pct": round((stage1_delay / total_stage_delay) * 100.0, 1),
                "primary_blocker": f"Field boundary survey is only {survey_done:.1f}% complete." if survey_done < 100 else "Plot demarcations verified.",
                "status": stage1_status
            },
            {
                "stage_id": 2,
                "stage_name": "Section 15 Objections & Hearings",
                "predicted_delay_days": stage2_delay,
                "risk_contribution_pct": round((stage2_delay / total_stage_delay) * 100.0, 1),
                "primary_blocker": f"{disputes} title dispute(s) and {court_cases} court case(s) pending." if disputes > 0 or court_cases > 0 else "No active hearings blocked.",
                "status": stage2_status
            },
            {
                "stage_id": 3,
                "stage_name": "RoR Title Deed & Claim Verification",
                "predicted_delay_days": stage3_delay,
                "risk_contribution_pct": round((stage3_delay / total_stage_delay) * 100.0, 1),
                "primary_blocker": f"{missing_doc:.1f}% documents have OCR typos or unverified title deeds." if missing_doc > 0 else "All title documents verified.",
                "status": stage3_status
            },
            {
                "stage_id": 4,
                "stage_name": "Valuation, Award & Bank Disbursement",
                "predicted_delay_days": stage4_delay,
                "risk_contribution_pct": round((stage4_delay / total_stage_delay) * 100.0, 1),
                "primary_blocker": f"Compensation progress is at {comp_progress:.1f}% with pending bank account verification." if comp_progress < 100 else "Compensation disbursed.",
                "status": stage4_status
            },
            {
                "stage_id": 5,
                "stage_name": "Environmental Clearance & Possession Handover",
                "predicted_delay_days": stage5_delay,
                "risk_contribution_pct": round((stage5_delay / total_stage_delay) * 100.0, 1),
                "primary_blocker": "Statutory forest/environmental permission pending." if not env_clearance else "Final possession handover in progress.",
                "status": stage5_status
            }
        ]

        # Explainability Contributing Factors (SHAP-style)
        contributing_factors = []
        if disputes > 0:
            contributing_factors.append({
                "factor": "Ownership Disputes",
                "impact": round(min(disputes * 0.18, 0.38), 2),
                "direction": "increases_risk",
                "description": f"{disputes} active title dispute(s) recorded among legal heirs."
            })
        if survey_done < 70.0:
            contributing_factors.append({
                "factor": "Pending Cadastral Survey",
                "impact": round(((100.0 - survey_done) / 100.0) * 0.28, 2),
                "direction": "increases_risk",
                "description": f"Cadastral field survey is only {survey_done:.1f}% complete."
            })
        if missing_doc > 15.0:
            contributing_factors.append({
                "factor": "Missing / Mismatched Documents",
                "impact": round((missing_doc / 100.0) * 0.22, 2),
                "direction": "increases_risk",
                "description": f"{missing_doc:.1f}% documents unverified or have discrepancy flags."
            })
        if comp_progress < 60.0:
            contributing_factors.append({
                "factor": "Compensation Pipeline Bottleneck",
                "impact": round(((100.0 - comp_progress) / 100.0) * 0.18, 2),
                "direction": "increases_risk",
                "description": f"Compensation disbursement is at {comp_progress:.1f}% progress."
            })
        if overdue_tasks > 0:
            contributing_factors.append({
                "factor": "Overdue Departmental Tasks",
                "impact": round(min(overdue_tasks * 0.08, 0.24), 2),
                "direction": "increases_risk",
                "description": f"{overdue_tasks} statutory task(s) past regulatory deadline."
            })
        if env_clearance:
            contributing_factors.append({
                "factor": "Environmental Clearance Approved",
                "impact": -0.06,
                "direction": "decreases_risk",
                "description": "Statutory environmental and forest permissions granted."
            })
        if survey_done >= 85.0:
            contributing_factors.append({
                "factor": "Completed Cadastral Demarcation",
                "impact": -0.12,
                "direction": "decreases_risk",
                "description": "Plot boundaries demarcated via verified DGPS survey."
            })

        recommended_actions = RecommendationService.generate_recommendations(features)

        return {
            "delay_probability": round(delay_probability, 3),
            "risk_level": risk_level,
            "urgency_level": urgency_level,
            "predicted_delay_days": delay_days,
            "model_version": "v1.4.0-rf-ensemble",
            "stage_forecasts": stage_forecasts,
            "contributing_factors": contributing_factors,
            "recommended_actions": recommended_actions,
            "disclaimer": "This prediction is decision-support information and must be reviewed by an authorised officer. It is not an automated legal decision."
        }

