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

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from feature_engineering import load_and_split_data, save_feature_columns, FEATURE_COLUMNS

ROOT_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT_DIR / "models"
REPORTS_DIR = ROOT_DIR / "reports"

def train_classifier():
    print("[*] Training Random Forest Delay Classifier...")
    X_train, X_test, y_train, y_test, _, _ = load_and_split_data()

    clf = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        class_weight="balanced"
    )
    clf.fit(X_train, y_train)

    # Evaluation
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)

    metrics = {
        "model_type": "RandomForestClassifier",
        "n_estimators": 150,
        "test_accuracy": round(acc, 4),
        "test_precision": round(prec, 4),
        "test_recall": round(rec, 4),
        "test_f1_score": round(f1, 4),
        "test_roc_auc": round(auc, 4),
        "training_timestamp": datetime.utcnow().isoformat()
    }

    print("\n--- CLASSIFIER EVALUATION METRICS ---")
    for k, v in metrics.items():
        print(f"  {k:<20}: {v}")

    # Export model & metrics
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    clf_path = MODELS_DIR / "delay_classifier.pkl"
    joblib.dump(clf, clf_path)
    print(f"\n[SUCCESS] Exported trained classifier to: {clf_path}")

    # Feature importances
    importances = dict(zip(FEATURE_COLUMNS, [round(float(i), 4) for i in clf.feature_importances_]))
    sorted_importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))

    metadata = {
        "model_name": "BhoomiSetu Delay Risk Classifier",
        "version": "v1.4.0-rf-ensemble",
        "metrics": metrics,
        "feature_importances": sorted_importances,
        "updated_at": datetime.utcnow().isoformat()
    }

    with open(MODELS_DIR / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    with open(REPORTS_DIR / "classification_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    save_feature_columns()
    return clf, metrics

if __name__ == "__main__":
    train_classifier()
