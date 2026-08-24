import os
import sys
import json
import joblib
from datetime import datetime
from pathlib import Path

# Add current directory to sys.path
sys.path.append(str(Path(__file__).resolve().parent))
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np
from feature_engineering import load_and_split_data

ROOT_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT_DIR / "models"
REPORTS_DIR = ROOT_DIR / "reports"

def train_regressor():
    print("[*] Training Random Forest Delay Days Regressor...")
    _, _, _, _, y_train_reg, y_test_reg = load_and_split_data()
    X_train, X_test, _, _, _, _ = load_and_split_data()

    reg = RandomForestRegressor(
        n_estimators=150,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42
    )
    reg.fit(X_train, y_train_reg)

    # Evaluation
    y_pred = reg.predict(X_test)
    mae = mean_absolute_error(y_test_reg, y_pred)
    rmse = float(np.sqrt(mean_squared_error(y_test_reg, y_pred)))
    r2 = r2_score(y_test_reg, y_pred)

    metrics = {
        "model_type": "RandomForestRegressor",
        "n_estimators": 150,
        "test_mae_days": round(mae, 2),
        "test_rmse_days": round(rmse, 2),
        "test_r2_score": round(r2, 4),
        "training_timestamp": datetime.utcnow().isoformat()
    }

    print("\n--- REGRESSOR EVALUATION METRICS ---")
    for k, v in metrics.items():
        print(f"  {k:<20}: {v}")

    # Export model & metrics
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    reg_path = MODELS_DIR / "delay_regressor.pkl"
    joblib.dump(reg, reg_path)
    print(f"\n[SUCCESS] Exported trained regressor to: {reg_path}")

    with open(REPORTS_DIR / "regression_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    return reg, metrics

if __name__ == "__main__":
    train_regressor()
