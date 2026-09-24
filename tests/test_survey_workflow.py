import unittest
import os
import sys
from pathlib import Path
from datetime import date, datetime

# Setup paths
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))
sys.path.append(str(ROOT_DIR / "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, SessionLocal
from scripts.seed_demo_data import init_and_seed_db
from app.security.jwt import create_access_token
from app.models.user import User
from app.models.survey import SurveyRequest

class TestSurveyWorkflow(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_and_seed_db()
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        # Generate tokens
        cls.so_user = cls.db.query(User).filter(User.role == "survey_officer").first()
        cls.lao_user = cls.db.query(User).filter(User.role == "land_acquisition_officer").first()
        cls.admin_user = cls.db.query(User).filter(User.role == "admin").first()

        cls.so_token = create_access_token({"sub": str(cls.so_user.id), "role": cls.so_user.role})
        cls.lao_token = create_access_token({"sub": str(cls.lao_user.id), "role": cls.lao_user.role})
        cls.admin_token = create_access_token({"sub": str(cls.admin_user.id), "role": cls.admin_user.role})

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_survey_dashboard_summary(self):
        """Test retrieving Survey Officer dashboard summary and delay metrics."""
        headers = {"Authorization": f"Bearer {self.so_token}"}
        resp = self.client.get("/api/surveys/dashboard/summary", headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("total_assigned", data)
        self.assertIn("in_progress_surveys", data)
        self.assertIn("resurvey_required", data)
        self.assertIn("avg_survey_duration_days", data)
        self.assertGreaterEqual(data["total_assigned"], 5)

    def test_02_survey_requests_list_and_filters(self):
        """Test listing survey requests with status and priority filters."""
        headers = {"Authorization": f"Bearer {self.so_token}"}
        resp = self.client.get("/api/surveys?status=IN_PROGRESS", headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(all(item["status"] == "IN_PROGRESS" for item in data))

    def test_03_create_survey_request_by_lao(self):
        """Test LAO creating and assigning a new survey request."""
        headers = {"Authorization": f"Bearer {self.lao_token}"}
        payload = {
            "case_id": 1,
            "parcel_id": 2,
            "assigned_so_id": self.so_user.id,
            "priority": "High",
            "purpose": "Unit Test Pipeline Demarcation Survey",
            "instructions": "Verify utility lines along road boundary."
        }
        resp = self.client.post("/api/surveys/request", json=payload, headers=headers)
        self.assertEqual(resp.status_code, 201)
        res_data = resp.json()
        self.assertEqual(res_data["status"], "SUCCESS")
        self.assertIn("id", res_data)
        self.__class__.created_survey_id = res_data["id"]

    def test_04_so_accept_schedule_and_start_workflow(self):
        """Test SO accepting, scheduling, and starting the created survey."""
        survey_id = getattr(self.__class__, "created_survey_id", 1)
        headers = {"Authorization": f"Bearer {self.so_token}"}

        # 1. Accept
        resp_accept = self.client.put(f"/api/surveys/{survey_id}/accept", headers=headers)
        self.assertEqual(resp_accept.status_code, 200)
        self.assertEqual(resp_accept.json()["new_status"], "ACCEPTED")

        # 2. Schedule
        schedule_payload = {
            "scheduled_date": "2026-09-12",
            "scheduled_time": "10:30 AM",
            "expected_duration_hours": 3.0,
            "field_team_members": "S. Mishra (SO), Amin Pipili",
            "special_instructions": "Notify landowner in advance."
        }
        resp_sched = self.client.put(f"/api/surveys/{survey_id}/schedule", json=schedule_payload, headers=headers)
        self.assertEqual(resp_sched.status_code, 200)
        self.assertEqual(resp_sched.json()["new_status"], "SCHEDULED")

        # 3. Start
        resp_start = self.client.put(f"/api/surveys/{survey_id}/start", headers=headers)
        self.assertEqual(resp_start.status_code, 200)
        self.assertEqual(resp_start.json()["new_status"], "IN_PROGRESS")

    def test_05_document_verification_and_gps_verification(self):
        """Test document verification flagging and device GPS coordinate calculation."""
        survey_id = getattr(self.__class__, "created_survey_id", 1)
        headers = {"Authorization": f"Bearer {self.so_token}"}

        # Document verification
        doc_payload = {
            "documents": [
                {
                    "doc_type": "Record of Rights (RoR)",
                    "doc_title": "RoR Khatiyan 312",
                    "verification_status": "VERIFIED",
                    "remarks": "RoR verified."
                },
                {
                    "doc_type": "Sale deed",
                    "doc_title": "Title Deed No 204",
                    "verification_status": "MISMATCH",
                    "mismatch_details": "Plot number spelling variant."
                }
            ]
        }
        resp_doc = self.client.put(f"/api/surveys/{survey_id}/documents/verify", json=doc_payload, headers=headers)
        self.assertEqual(resp_doc.status_code, 200)
        self.assertEqual(resp_doc.json()["mismatches"], 1)

        # GPS Verification
        gps_payload = {
            "captured_latitude": 20.122800,
            "captured_longitude": 85.833500,
            "is_manual_entry": False
        }
        resp_gps = self.client.post(f"/api/surveys/{survey_id}/gps/verify", json=gps_payload, headers=headers)
        self.assertEqual(resp_gps.status_code, 200)
        self.assertEqual(resp_gps.json()["location_status"], "LOCATION VERIFIED")

    def test_06_observations_evidence_discrepancy_and_submission(self):
        """Test saving observations, evidence, discrepancy, and digital submission to LAO."""
        survey_id = getattr(self.__class__, "created_survey_id", 1)
        headers = {"Authorization": f"Bearer {self.so_token}"}

        # Observations
        obs_payload = {
            "observed_area_acres": 4.5,
            "land_use": "Agricultural",
            "crop_type": "Swarna Paddy",
            "irrigation_available": True,
            "has_well": True,
            "trees_count": 5,
            "landowner_present": True,
            "boundary_status": "Boundary matches records"
        }
        resp_obs = self.client.put(f"/api/surveys/{survey_id}/observations", json=obs_payload, headers=headers)
        self.assertEqual(resp_obs.status_code, 200)

        # Evidence
        ev_payload = {
            "category": "Land Boundary",
            "title": "North Boundary Stone",
            "file_path": "sample-documents/valid_ror_plot142a.txt",
            "file_type": "photo",
            "latitude": 20.124580,
            "longitude": 85.832450
        }
        resp_ev = self.client.post(f"/api/surveys/{survey_id}/evidence", json=ev_payload, headers=headers)
        self.assertEqual(resp_ev.status_code, 200)

        # Digital Certification & Submission
        submit_payload = {
            "digital_signature_confirmed": True,
            "certification_statement": "I certify that the information recorded in this survey report is based on the field survey conducted by me.",
            "final_recommendation": "Survey Completed",
            "final_remarks": "Boundaries confirmed on site."
        }
        resp_sub = self.client.post(f"/api/surveys/{survey_id}/submit", json=submit_payload, headers=headers)
        self.assertEqual(resp_sub.status_code, 200)
        self.assertEqual(resp_sub.json()["new_status"], "SUBMITTED")

    def test_07_lao_review_and_approval(self):
        """Test LAO reviewing and approving submitted survey report."""
        survey_id = getattr(self.__class__, "created_survey_id", 1)
        headers = {"Authorization": f"Bearer {self.lao_token}"}

        review_payload = {
            "action": "APPROVE",
            "remarks": "Survey verified and approved for Section 19 declaration."
        }
        resp_rev = self.client.put(f"/api/surveys/{survey_id}/review", json=review_payload, headers=headers)
        self.assertEqual(resp_rev.status_code, 200)
        self.assertEqual(resp_rev.json()["new_status"], "COMPLETED")

if __name__ == "__main__":
    unittest.main()
