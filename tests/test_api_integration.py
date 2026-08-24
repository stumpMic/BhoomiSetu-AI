import sys
import unittest
from pathlib import Path

# Add backend and scripts to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent / "backend"))
sys.path.append(str(Path(__file__).resolve().parent.parent / "scripts"))

from seed_demo_data import init_and_seed_db
from app.database import SessionLocal
from app.models.acquisition_case import AcquisitionCase
from app.models.parcel import Parcel, ParcelOwnership
from app.models.document import Document
from app.models.task import DepartmentalTask
from app.models.compensation import Compensation
from app.api.dashboard import get_dashboard_summary
from app.api.projects import list_projects
from app.api.cases import list_cases, get_case
from app.api.parcels import get_parcels_map
from app.api.predictions import get_latest_prediction
from app.services.risk_recalculation_service import RiskRecalculationService

class TestBhoomiSetuDirectAPIs(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Reset database to fresh seed state
        init_and_seed_db()

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_dashboard_summary(self):
        res = get_dashboard_summary(db=self.db)
        self.assertTrue(hasattr(res, "kpis"))
        self.assertGreaterEqual(res.kpis.total_projects, 3)
        self.assertGreaterEqual(res.kpis.total_cases, 30)

    def test_02_projects_listing(self):
        projects = list_projects(db=self.db)
        self.assertGreaterEqual(len(projects), 3)

    def test_03_cases_listing(self):
        cases = list_cases(db=self.db)
        self.assertGreaterEqual(len(cases), 30)

    def test_04_gis_parcels_map_geojson(self):
        fc = get_parcels_map(db=self.db)
        self.assertEqual(fc.type, "FeatureCollection")
        self.assertGreaterEqual(len(fc.features), 80)

    def test_05_prediction_details(self):
        pred = get_latest_prediction(case_id=4, db=self.db)
        self.assertGreaterEqual(pred.delay_probability, 0.70)
        self.assertEqual(pred.risk_level, "High")

    def test_06_dynamic_risk_recalculation_walkthrough(self):
        # Demo Walkthrough verification:
        # Case 4 starts at High Risk (~84%)
        # Resolving parcel ownership dispute, verifying document, completing survey, and advancing compensation
        case = self.db.query(AcquisitionCase).filter(AcquisitionCase.id == 4).first()
        initial_prob = float(case.current_delay_probability)
        self.assertGreaterEqual(initial_prob, 0.70)
        self.assertEqual(case.current_risk_level, "High")

        # 1. Resolve Co-sharer dispute on Plot 142/A
        self.db.query(ParcelOwnership).filter(ParcelOwnership.parcel_id == 12).update({
            "dispute_flag": False,
            "dispute_remarks": "Resolved via Mutual Family Partition Settlement"
        })

        # 2. Mark survey completed on all Case 4 parcels
        self.db.query(Parcel).filter(Parcel.case_id == 4).update({
            "survey_status": "Completed"
        })

        # 3. Verify all pending documents for Case 4
        self.db.query(Document).filter(Document.case_id == 4).update({
            "verification_status": "Verified"
        })

        # 4. Advance compensation to Stage 8 (Payment initiated)
        self.db.query(Compensation).filter(Compensation.case_id == 4).update({
            "stage_index": 8,
            "current_stage": "Payment initiated"
        })

        # 5. Mark overdue tasks completed
        self.db.query(DepartmentalTask).filter(DepartmentalTask.case_id == 4).update({
            "status": "Completed",
            "is_overdue": False
        })
        self.db.commit()

        # Execute dynamic recalculation
        RiskRecalculationService.recalculate_case_risk(self.db, 4, trigger_reason="Full Demo Walkthrough Resolution")
        self.db.refresh(case)

        updated_prob = float(case.current_delay_probability)
        print(f"\n[DEMO WALKTHROUGH CHECK] Case 4 Risk: Initial={initial_prob:.1%} (High Risk) -> Recalculated={updated_prob:.1%} ({case.current_risk_level} Risk, +{case.predicted_delay_days}d delay)")
        self.assertLess(updated_prob, initial_prob)
        self.assertIn(case.current_risk_level, ["Medium", "Low"])

if __name__ == "__main__":
    unittest.main()
