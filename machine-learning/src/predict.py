import os
import json
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any

ROOT_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT_DIR / "models"

def run_prediction(features_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Standalone prediction inferencer using trained models or deterministic rule fallback.
    """
    clf_path = MODELS_DIR / "delay_classifier.pkl"
    reg_path = MODELS_DIR / "delay_regressor.pkl"

    missing_doc = float(features_dict.get("missing_doc_pct", 0.0))
    survey_done = float(features_dict.get("survey_completed_pct", 100.0))
    disputes = int(features_dict.get("ownership_disputes_count", 0))
    court_cases = int(features_dict.get("court_cases_count", 0))
    pending_approvals = int(features_dict.get("pending_approvals_count", 0))
    comp_prog = float(features_dict.get("compensation_progress_pct", 100.0))
    bank_verif = float(features_dict.get("bank_verification_pct", 100.0))
    overdue = int(features_dict.get("overdue_tasks_count", 0))
    env_clear = 1 if features_dict.get("environmental_clearance", True) else 0
    rehab_req = 1 if features_dict.get("rehabilitation_required", False) else 0
    district_delay = float(features_dict.get("district_delay_rate", 35.0))

    # Deterministic base
    score = (
        0.12 +
        (missing_doc / 100.0) * 0.25 +
        ((100.0 - survey_done) / 100.0) * 0.22 +
        min(disputes * 0.15, 0.35) +
        min(court_cases * 0.20, 0.38) +
        min(pending_approvals * 0.08, 0.20) +
        ((100.0 - comp_prog) / 100.0) * 0.15 +
        ((100.0 - bank_verif) / 100.0) * 0.10 +
        min(overdue * 0.06, 0.20) +
        (1 - env_clear) * 0.18 +
        rehab_req * 0.10 +
        (district_delay / 100.0) * 0.08
    )
    delay_prob = float(np.clip(score, 0.05, 0.95))
    delay_days = int(delay_prob * 180 + overdue * 12 + disputes * 25)

    if clf_path.exists() and reg_path.exists():
        try:
            clf = joblib.load(clf_path)
            reg = joblib.load(reg_path)
            vec = np.array([[
                features_dict.get("total_parcels", 5),
                features_dict.get("total_landowners", 4),
                features_dict.get("total_land_area", 15.0),
                missing_doc,
                survey_done,
                disputes,
                court_cases,
                pending_approvals,
                comp_prog,
                bank_verif,
                features_dict.get("open_grievances_count", 1),
                features_dict.get("avg_dept_response_days", 14.0),
                env_clear,
                rehab_req,
                district_delay,
                overdue,
                features_dict.get("days_remaining", 90)
            ]])
            ml_prob = float(clf.predict_proba(vec)[0][1])
            ml_days = int(reg.predict(vec)[0])
            delay_prob = float(np.clip(0.6 * ml_prob + 0.4 * score, 0.05, 0.96))
            delay_days = max(int(0.6 * ml_days + 0.4 * delay_days), 0)
        except Exception:
            pass

    risk_level = "Low" if delay_prob < 0.40 else ("Medium" if delay_prob < 0.70 else "High")

    return {
        "delay_probability": round(delay_prob, 3),
        "risk_level": risk_level,
        "predicted_delay_days": delay_days
    }

if __name__ == "__main__":
    demo_high_risk = {
        "missing_doc_pct": 35.0,
        "survey_completed_pct": 40.0,
        "ownership_disputes_count": 2,
        "court_cases_count": 1,
        "pending_approvals_count": 2,
        "compensation_progress_pct": 30.0,
        "bank_verification_pct": 45.0,
        "overdue_tasks_count": 2
    }
    print("Demo High Risk Prediction:", run_prediction(demo_high_risk))
