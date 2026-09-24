import sys
import unittest
from pathlib import Path

# Add backend and scripts to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent / "backend"))
sys.path.append(str(Path(__file__).resolve().parent.parent / "scripts"))

from seed_demo_data import init_and_seed_db
from app.database import SessionLocal
from app.models.user import User
from app.models.verification_record import VerificationRequest
from app.api.auth import login, register_landowner, register_officer, send_otp, verify_otp
from app.api.admin_verifications import get_pending_verifications, review_verification, get_verification_stats
from app.schemas.auth import LoginRequest
from app.schemas.verification import OTPRequest, OTPVerifyRequest, VerificationReviewActionRequest
from fastapi import HTTPException

class TestRoleBasedRegistration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_and_seed_db()

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_otp_dispatch_and_validation(self):
        # 1. Send OTP
        otp_req = OTPRequest(identifier="+91 94370 99999", account_type="Landowner")
        res = send_otp(otp_req)
        self.assertTrue(res.success)
        self.assertEqual(res.demo_otp, "123456")

        # 2. Verify Valid OTP
        verify_req = OTPVerifyRequest(identifier="+91 94370 99999", otp_code="123456")
        v_res = verify_otp(verify_req)
        self.assertTrue(v_res["success"])

        # 3. Verify Invalid OTP
        with self.assertRaises(HTTPException) as ctx:
            verify_otp(OTPVerifyRequest(identifier="+91 94370 99999", otp_code="999999"))
        self.assertEqual(ctx.exception.status_code, 400)

    def test_02_landowner_registration_whitelist_match(self):
        # Register Landowner matching LAND-DEMO-002 (Bimal Kumar Jena, Plot 101, Khata 201)
        res = register_landowner(
            full_name="Bimal Kumar Jena",
            email="bimal.jena.new@gmail.com",
            phone="+91 94371 99001",
            password="DemoPass123!",
            confirm_password="DemoPass123!",
            address="At/PO: Pipili Bazar",
            district="Khurda",
            state="Odisha",
            land_record_id="LAND-DEMO-002",
            tahasil="Pipili",
            village="Pipili",
            plot_number="101",
            khata_number="201",
            doc_ref_number="ROR-2026-9901",
            document_file=None,
            db=self.db
        )
        self.assertTrue(res.success)
        self.assertEqual(res.verification_status, "VERIFIED")

        # Verify can login immediately
        login_res = login(LoginRequest(email="bimal.jena.new@gmail.com", password="DemoPass123!"), db=self.db)
        self.assertIsNotNone(login_res.access_token)
        self.assertEqual(login_res.user.role, "landowner")

    def test_03_landowner_registration_unverified_land_record(self):
        # Register Landowner with unverified plot -> PENDING_VERIFICATION
        res = register_landowner(
            full_name="Ramesh Chandra Sahoo",
            email="ramesh.sahoo.test@gmail.com",
            phone="+91 94371 99002",
            password="DemoPass123!",
            confirm_password="DemoPass123!",
            address="Nuagaon Sahi",
            district="Khurda",
            state="Odisha",
            land_record_id=None,
            tahasil="Pipili",
            village="Nuagaon",
            plot_number="999/B",
            khata_number="888",
            doc_ref_number="ROR-MANUAL-01",
            document_file=None,
            db=self.db
        )
        self.assertTrue(res.success)
        self.assertEqual(res.verification_status, "PENDING_VERIFICATION")

        # Verify login is blocked with HTTP 403
        with self.assertRaises(HTTPException) as ctx:
            login(LoginRequest(email="ramesh.sahoo.test@gmail.com", password="DemoPass123!"), db=self.db)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("awaiting verification", ctx.exception.detail)

    def test_04_officer_registration_invalid_credentials_rejected(self):
        # Try to register as Officer with fraudulent/unrecognized credentials
        with self.assertRaises(HTTPException) as ctx:
            register_officer(
                full_name="Fake Officer",
                official_email="fake.officer@bhoomisetu.gov.in",
                phone="+91 99999 00000",
                password="DemoPass123!",
                confirm_password="DemoPass123!",
                department="Revenue & Land Reforms Department",
                designation="Sub-Collector",
                district="Khurda",
                office_name="Collectorate Khurda",
                officer_id="OFF-FRAUD-999", # Invalid
                office_code="REV-INVALID-99", # Invalid
                authorization_document=None,
                db=self.db
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Officer verification failed", ctx.exception.detail)

    def test_05_officer_registration_valid_whitelist_pending_admin_approval(self):
        # Register Officer matching whitelist OFF-DEMO-001 (REV-BBSR-01)
        res = register_officer(
            full_name="Shri Suresh Mohanty",
            official_email="officer.demo@bhoomisetu.gov.in",
            phone="+91 94370 77771",
            password="DemoPass123!",
            confirm_password="DemoPass123!",
            department="Revenue & Land Reforms Department",
            designation="Sub-Collector & LAO",
            district="Khurda",
            office_name="Sub-Collector Office, Bhubaneswar",
            officer_id="OFF-DEMO-001",
            office_code="REV-BBSR-01",
            authorization_document=None,
            db=self.db
        )
        self.assertTrue(res.success)
        self.assertEqual(res.verification_status, "PENDING_VERIFICATION")

        # Blocked before admin review
        with self.assertRaises(HTTPException) as ctx:
            login(LoginRequest(email="officer.demo@bhoomisetu.gov.in", password="DemoPass123!"), db=self.db)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_06_admin_review_and_approval_workflow(self):
        admin = self.db.query(User).filter(User.email == "admin@bhoomisetu.gov.in").first()
        
        # 1. Admin checks pending requests
        pending_list = get_pending_verifications(db=self.db, current_user=admin)
        self.assertGreaterEqual(len(pending_list), 2)

        # 2. Find request for officer.demo@bhoomisetu.gov.in
        target_req = next((r for r in pending_list if r.email == "officer.demo@bhoomisetu.gov.in"), None)
        self.assertIsNotNone(target_req)

        # 3. Admin approves officer request
        action_payload = VerificationReviewActionRequest(
            action="APPROVE",
            notes="Authorized credentials verified against Departmental Gazzette."
        )
        review_res = review_verification(
            request_id=target_req.id,
            action_data=action_payload,
            db=self.db,
            current_user=admin
        )
        self.assertTrue(review_res["success"])
        self.assertEqual(review_res["status"], "APPROVED")

        # 4. Officer can now login successfully
        officer_login = login(LoginRequest(email="officer.demo@bhoomisetu.gov.in", password="DemoPass123!"), db=self.db)
        self.assertEqual(officer_login.user.verification_status, "VERIFIED")
        self.assertEqual(officer_login.user.role, "land_acquisition_officer")

if __name__ == "__main__":
    unittest.main()
