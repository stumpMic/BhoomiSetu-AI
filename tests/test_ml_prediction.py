import sys
import unittest
from pathlib import Path

# Add backend and ML to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent / "backend"))
sys.path.append(str(Path(__file__).resolve().parent.parent / "machine-learning" / "src"))

from predict import run_prediction
from explain import explain_prediction

class TestMLPrediction(unittest.TestCase):
    def test_high_risk_case(self):
        high_risk_features = {
            "missing_doc_pct": 40.0,
            "survey_completed_pct": 30.0,
            "ownership_disputes_count": 2,
            "court_cases_count": 1,
            "pending_approvals_count": 2,
            "compensation_progress_pct": 25.0,
            "bank_verification_pct": 30.0,
            "overdue_tasks_count": 3
        }
        res = run_prediction(high_risk_features)
        self.assertIn("delay_probability", res)
        self.assertIn("risk_level", res)
        self.assertEqual(res["risk_level"], "High")
        self.assertGreaterEqual(res["delay_probability"], 0.70)
        self.assertGreater(res["predicted_delay_days"], 60)

    def test_low_risk_case(self):
        low_risk_features = {
            "missing_doc_pct": 0.0,
            "survey_completed_pct": 100.0,
            "ownership_disputes_count": 0,
            "court_cases_count": 0,
            "pending_approvals_count": 0,
            "compensation_progress_pct": 90.0,
            "bank_verification_pct": 95.0,
            "overdue_tasks_count": 0
        }
        res = run_prediction(low_risk_features)
        self.assertEqual(res["risk_level"], "Low")
        self.assertLess(res["delay_probability"], 0.40)

    def test_explainability_generation(self):
        features = {
            "ownership_disputes_count": 2,
            "survey_completed_pct": 45.0,
            "missing_doc_pct": 30.0
        }
        explanations = explain_prediction(features)
        self.assertIsInstance(explanations, list)
        self.assertGreater(len(explanations), 0)
        factor_names = [e["factor"] for e in explanations]
        self.assertIn("Ownership Disputes", factor_names)

if __name__ == "__main__":
    unittest.main()
