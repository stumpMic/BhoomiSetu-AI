import json
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, List

ROOT_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT_DIR / "models"

def explain_prediction(features_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generate feature attribution explanations for a case prediction.
    """
    factors = []
    
    disputes = int(features_dict.get("ownership_disputes_count", 0))
    if disputes > 0:
        factors.append({
            "factor": "Ownership Disputes",
            "impact": round(min(disputes * 0.18, 0.38), 2),
            "direction": "increases_risk",
            "description": f"{disputes} active title dispute(s) between co-sharers recorded."
        })

    survey = float(features_dict.get("survey_completed_pct", 100.0))
    if survey < 70.0:
        factors.append({
            "factor": "Pending Cadastral Survey",
            "impact": round(((100.0 - survey) / 100.0) * 0.28, 2),
            "direction": "increases_risk",
            "description": f"Cadastral field survey only {survey:.1f}% complete."
        })
    elif survey >= 85.0:
        factors.append({
            "factor": "Completed Cadastral Demarcation",
            "impact": -0.12,
            "direction": "decreases_risk",
            "description": f"DGPS boundary survey completed ({survey:.1f}%)."
        })

    missing_doc = float(features_dict.get("missing_doc_pct", 0.0))
    if missing_doc > 15.0:
        factors.append({
            "factor": "Missing / Mismatched Documents",
            "impact": round((missing_doc / 100.0) * 0.22, 2),
            "direction": "increases_risk",
            "description": f"{missing_doc:.1f}% documents have pending verification or discrepancy flags."
        })

    comp_prog = float(features_dict.get("compensation_progress_pct", 100.0))
    if comp_prog < 50.0:
        factors.append({
            "factor": "Compensation Pipeline Delay",
            "impact": round(((100.0 - comp_prog) / 100.0) * 0.18, 2),
            "direction": "increases_risk",
            "description": f"Compensation pipeline at only {comp_prog:.1f}% progress."
        })

    overdue = int(features_dict.get("overdue_tasks_count", 0))
    if overdue > 0:
        factors.append({
            "factor": "Overdue Departmental Tasks",
            "impact": round(min(overdue * 0.08, 0.24), 2),
            "direction": "increases_risk",
            "description": f"{overdue} statutory task(s) past regulatory deadline."
        })

    env = bool(features_dict.get("environmental_clearance", True))
    if env:
        factors.append({
            "factor": "Environmental Clearance Approved",
            "impact": -0.06,
            "direction": "decreases_risk",
            "description": "Statutory environmental and forest permissions granted."
        })

    return factors
