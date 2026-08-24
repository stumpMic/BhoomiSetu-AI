import os
import sys
import numpy as np
import pandas as pd
from pathlib import Path

# Set UTF-8 encoding for standard output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT_DIR / "data" / "synthetic"

def generate_synthetic_dataset(n_samples: int = 2500, random_state: int = 42) -> pd.DataFrame:
    np.random.seed(random_state)
    print(f"[*] Generating {n_samples} synthetic land acquisition case records...")

    # 1. Macro & Case Characteristics
    total_parcels = np.random.randint(1, 20, size=n_samples)
    total_landowners = total_parcels * np.random.randint(1, 4, size=n_samples)
    total_land_area = np.round(total_parcels * np.random.uniform(0.8, 4.5, size=n_samples), 2)
    
    # 2. Operational Metrics
    missing_doc_pct = np.round(np.random.beta(2, 5, size=n_samples) * 100, 1)
    survey_completed_pct = np.round(np.random.beta(5, 2, size=n_samples) * 100, 1)
    
    # Disputes & Legal
    ownership_disputes_count = np.random.choice([0, 1, 2, 3, 4], p=[0.55, 0.25, 0.12, 0.05, 0.03], size=n_samples)
    court_cases_count = np.random.choice([0, 1, 2, 3], p=[0.75, 0.18, 0.05, 0.02], size=n_samples)
    pending_approvals_count = np.random.choice([0, 1, 2, 3, 4], p=[0.40, 0.35, 0.15, 0.07, 0.03], size=n_samples)
    
    # Compensation & Banking
    compensation_progress_pct = np.round(np.random.uniform(10, 100, size=n_samples), 1)
    bank_verification_pct = np.round(np.clip(compensation_progress_pct + np.random.normal(0, 15, size=n_samples), 0, 100), 1)
    
    # Grievances & Workflow
    open_grievances_count = np.random.choice([0, 1, 2, 3, 4, 5], p=[0.45, 0.28, 0.14, 0.08, 0.03, 0.02], size=n_samples)
    avg_dept_response_days = np.round(np.random.gamma(shape=3.0, scale=4.5, size=n_samples), 1)
    environmental_clearance = np.random.choice([1, 0], p=[0.85, 0.15], size=n_samples)
    rehabilitation_required = np.random.choice([0, 1], p=[0.70, 0.30], size=n_samples)
    district_delay_rate = np.round(np.random.uniform(20.0, 55.0, size=n_samples), 1)
    overdue_tasks_count = np.random.choice([0, 1, 2, 3, 4], p=[0.50, 0.28, 0.14, 0.05, 0.03], size=n_samples)
    days_remaining = np.random.randint(15, 300, size=n_samples)

    # 3. Derive Ground Truth Delay Probability & Target Variables
    risk_score = (
        0.10 +
        (missing_doc_pct / 100.0) * 0.25 +
        ((100.0 - survey_completed_pct) / 100.0) * 0.22 +
        np.minimum(ownership_disputes_count * 0.14, 0.35) +
        np.minimum(court_cases_count * 0.18, 0.36) +
        np.minimum(pending_approvals_count * 0.06, 0.20) +
        ((100.0 - compensation_progress_pct) / 100.0) * 0.15 +
        ((100.0 - bank_verification_pct) / 100.0) * 0.10 +
        np.minimum(overdue_tasks_count * 0.05, 0.20) +
        (1 - environmental_clearance) * 0.16 +
        rehabilitation_required * 0.10 +
        (district_delay_rate / 100.0) * 0.08 +
        np.random.normal(0, 0.04, size=n_samples)
    )

    delay_prob = np.clip(risk_score, 0.02, 0.98)
    delayed_binary = (delay_prob >= 0.45).astype(int)
    
    # Estimate delay days with noise
    delayed_days = np.where(
        delayed_binary == 1,
        np.maximum(0, (delay_prob * 160 + overdue_tasks_count * 15 + ownership_disputes_count * 20 + np.random.normal(0, 12, size=n_samples)).astype(int)),
        np.maximum(0, np.random.exponential(scale=6, size=n_samples).astype(int))
    )

    risk_level = np.where(delay_prob < 0.40, "Low", np.where(delay_prob < 0.70, "Medium", "High"))

    df = pd.DataFrame({
        "case_id": np.arange(1, n_samples + 1),
        "total_parcels": total_parcels,
        "total_landowners": total_landowners,
        "total_land_area": total_land_area,
        "missing_doc_pct": missing_doc_pct,
        "survey_completed_pct": survey_completed_pct,
        "ownership_disputes_count": ownership_disputes_count,
        "court_cases_count": court_cases_count,
        "pending_approvals_count": pending_approvals_count,
        "compensation_progress_pct": compensation_progress_pct,
        "bank_verification_pct": bank_verification_pct,
        "open_grievances_count": open_grievances_count,
        "avg_dept_response_days": avg_dept_response_days,
        "environmental_clearance": environmental_clearance,
        "rehabilitation_required": rehabilitation_required,
        "district_delay_rate": district_delay_rate,
        "overdue_tasks_count": overdue_tasks_count,
        "days_remaining": days_remaining,
        "delay_probability": np.round(delay_prob, 3),
        "delayed_binary": delayed_binary,
        "delayed_days": delayed_days,
        "risk_level": risk_level
    })

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    csv_path = OUTPUT_DIR / "synthetic_cases.csv"
    df.to_csv(csv_path, index=False)
    print(f"[SUCCESS] Generated {len(df)} cases and saved to: {csv_path}")
    print(f"  Risk Level Breakdown: {dict(df['risk_level'].value_counts())}")
    print(f"  Delayed Binary Ratio: {df['delayed_binary'].mean():.2%}")
    return df

if __name__ == "__main__":
    generate_synthetic_dataset(2500)
