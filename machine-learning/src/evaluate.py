import os
import sys
import json
import joblib
from pathlib import Path

# Add current directory to sys.path
sys.path.append(str(Path(__file__).resolve().parent))
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

import pandas as pd
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, mean_absolute_error, mean_squared_error, r2_score
)
from feature_engineering import load_and_split_data, FEATURE_COLUMNS

ROOT_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT_DIR / "models"
REPORTS_DIR = ROOT_DIR / "reports"

def evaluate_models():
    print("[*] Evaluating trained BhoomiSetu AI ML models on holdout test set...")
    clf_path = MODELS_DIR / "delay_classifier.pkl"
    reg_path = MODELS_DIR / "delay_regressor.pkl"

    if not clf_path.exists() or not reg_path.exists():
        print("[!] Models not found. Training models first...")
        from train_classifier import train_classifier
        from train_regressor import train_regressor
        train_classifier()
        train_regressor()

    clf = joblib.load(clf_path)
    reg = joblib.load(reg_path)

    X_train, X_test, y_train_class, y_test_class, y_train_reg, y_test_reg = load_and_split_data()

    # Classifier Evaluation
    y_pred_class = clf.predict(X_test)
    y_prob_class = clf.predict_proba(X_test)[:, 1]

    clf_metrics = {
        "accuracy": round(accuracy_score(y_test_class, y_pred_class), 4),
        "precision": round(precision_score(y_test_class, y_pred_class), 4),
        "recall": round(recall_score(y_test_class, y_pred_class), 4),
        "f1_score": round(f1_score(y_test_class, y_pred_class), 4),
        "roc_auc": round(roc_auc_score(y_test_class, y_prob_class), 4)
    }

    # Regressor Evaluation
    y_pred_reg = reg.predict(X_test)
    reg_metrics = {
        "mae_days": round(mean_absolute_error(y_test_reg, y_pred_reg), 2),
        "rmse_days": round(float(np.sqrt(mean_squared_error(y_test_reg, y_pred_reg))), 2),
        "r2_score": round(r2_score(y_test_reg, y_pred_reg), 4)
    }

    print("\n================ ML EVALUATION REPORT ================")
    print("  CLASSIFICATION (Delay vs On-time):")
    for k, v in clf_metrics.items():
        print(f"    - {k:<15}: {v}")
    print("\n  REGRESSION (Delay Duration in Days):")
    for k, v in reg_metrics.items():
        print(f"    - {k:<15}: {v}")
    print("======================================================")

    return clf_metrics, reg_metrics

if __name__ == "__main__":
    evaluate_models()
