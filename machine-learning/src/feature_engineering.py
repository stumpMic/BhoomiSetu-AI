import json
from pathlib import Path
from typing import Tuple, List
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

FEATURE_COLUMNS = [
    "total_parcels",
    "total_landowners",
    "total_land_area",
    "missing_doc_pct",
    "survey_completed_pct",
    "ownership_disputes_count",
    "court_cases_count",
    "pending_approvals_count",
    "compensation_progress_pct",
    "bank_verification_pct",
    "open_grievances_count",
    "avg_dept_response_days",
    "environmental_clearance",
    "rehabilitation_required",
    "district_delay_rate",
    "overdue_tasks_count",
    "days_remaining"
]

def load_and_split_data(csv_path: str = None, test_size: float = 0.2, random_state: int = 42) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series, pd.Series]:
    if csv_path is None:
        csv_path = Path(__file__).resolve().parent.parent / "data" / "synthetic" / "synthetic_cases.csv"
    
    df = pd.read_csv(csv_path)
    X = df[FEATURE_COLUMNS]
    y_class = df["delayed_binary"]
    y_reg = df["delayed_days"]

    X_train, X_test, y_train_class, y_test_class = train_test_split(
        X, y_class, test_size=test_size, random_state=random_state, stratify=y_class
    )
    
    y_train_reg = y_reg.loc[X_train.index]
    y_test_reg = y_reg.loc[X_test.index]

    return X_train, X_test, y_train_class, y_test_class, y_train_reg, y_test_reg

def save_feature_columns(output_path: str = None):
    if output_path is None:
        output_path = Path(__file__).resolve().parent.parent / "models" / "feature_columns.json"
    
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(FEATURE_COLUMNS, f, indent=2)
    print(f"[+] Saved feature columns definition to: {output_path}")

if __name__ == "__main__":
    save_feature_columns()
