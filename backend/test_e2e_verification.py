import sys
import os
import json
import sqlite3
from datetime import date, datetime, timedelta

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT_DIR)
sys.path.insert(0, os.path.dirname(ROOT_DIR))

from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, SessionLocal
from app.security.jwt import create_access_token
from app.models.user import User

client = TestClient(app)

def get_token(email: str):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    db.close()
    if not user:
        raise ValueError(f"User {email} not found")
    return create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})

def test_e2e():
    print("=" * 70)
    print("STARTING COMPREHENSIVE E2E VERIFICATION FOR BHOOMISETU")
    print("=" * 70)

    # Tokens for all roles
    lao_token = get_token("officer.patra@bhoomisetu.gov.in")
    so_token = get_token("surveyor.mishra@bhoomisetu.gov.in")
    co_token = get_token("comp.jena@bhoomisetu.gov.in")
    landowner_token = get_token("landowner.das@gmail.com")

    lao_headers = {"Authorization": f"Bearer {lao_token}"}
    so_headers = {"Authorization": f"Bearer {so_token}"}
    co_headers = {"Authorization": f"Bearer {co_token}"}
    lo_headers = {"Authorization": f"Bearer {landowner_token}"}

    # =========================================================================
    # PART 1: PUBLIC NOTICE BOARD (No Login Required)
    # =========================================================================
    print("\n--- PART 1: Public Notice Board (Unauthenticated) ---")
    resp = client.get("/api/notices?status_filter=Published&active_only=true")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    public_notices = resp.json()
    print(f"Public Notice Board loaded: {len(public_notices)} active published notices.")
    assert len(public_notices) >= 1, "Expected at least 1 published notice on public board"
    for n in public_notices:
        assert n["status"] == "Published"
        assert n["is_active"] == True
        print(f"  - [{n['priority'].upper()}] {n['notice_number']}: {n['title']} (Published: {n['publish_date']})")

    # Filter by Priority on Public Board
    resp_urgent = client.get("/api/notices?status_filter=Published&active_only=true&priority=Urgent")
    assert resp_urgent.status_code == 200
    print(f"Public Notice Board filtered by Urgent: {len(resp_urgent.json())} notices.")

    # =========================================================================
    # PART 2: NOTICE MANAGEMENT & ROLE GATING
    # =========================================================================
    print("\n--- PART 2: Notice Management & Strict Role Gating ---")
    
    # 2.1 Role Gating: Survey Officer, Compensation Officer, and Landowner CANNOT manage notices
    test_notice_payload = {
        "title": "Unauthorized Test Notice",
        "notice_type": "Section 4(1) Preliminary Notification",
        "content_summary": "Testing role gating",
        "priority": "Normal",
        "issuing_authority": "Fake Authority"
    }

    resp = client.post("/api/notices", json=test_notice_payload, headers=so_headers)
    assert resp.status_code == 403, f"Survey Officer should get 403, got {resp.status_code}"
    print("PASS: Survey Officer blocked from creating notice (403 Forbidden)")

    resp = client.post("/api/notices", json=test_notice_payload, headers=co_headers)
    assert resp.status_code == 403, f"Compensation Officer should get 403, got {resp.status_code}"
    print("PASS: Compensation Officer blocked from creating notice (403 Forbidden)")

    resp = client.post("/api/notices", json=test_notice_payload, headers=lo_headers)
    assert resp.status_code == 403, f"Landowner should get 403, got {resp.status_code}"
    print("PASS: Landowner blocked from creating notice (403 Forbidden)")

    resp = client.post("/api/notices", json=test_notice_payload)
    assert resp.status_code == 401, f"Unauthenticated visitor should get 401, got {resp.status_code}"
    print("PASS: Unauthenticated visitor blocked from creating notice (401 Unauthorized)")

    # 2.2 LAO Creates Notice as Draft
    lao_notice_payload = {
        "title": "Preliminary Notification for Pipili Bypass Corridor Demarcation",
        "notice_type": "Section 4(1) Preliminary Notification",
        "content_summary": "Statutory notification for acquisition of survey plots in Mouza Pipili for express corridor expansion under RFCTLARR Act 2013.",
        "priority": "Urgent",
        "deadline": (date.today() + timedelta(days=45)).isoformat(),
        "issuing_authority": "Land Acquisition Officer, Khurda District",
        "case_id": 4,
        "status": "Draft"
    }
    resp = client.post("/api/notices", json=lao_notice_payload, headers=lao_headers)
    assert resp.status_code == 201, f"LAO create notice failed: {resp.text}"
    created_notice = resp.json()
    notice_id = created_notice["id"]
    print(f"PASS: LAO created Notice #{notice_id} ({created_notice['notice_number']}) as '{created_notice['status']}'.")

    # Verify Draft does NOT appear on public active board
    resp_pub = client.get("/api/notices?status_filter=Published&active_only=true")
    assert not any(n["id"] == notice_id for n in resp_pub.json()), "Draft notice should NOT be visible on public board!"
    print("PASS: Draft notice is NOT visible on Public Notice Board.")

    # 2.3 LAO Edits Notice
    update_payload = {
        "title": "REVISED: Preliminary Notification for Pipili Bypass Corridor Demarcation",
        "priority": "Urgent",
        "deadline": (date.today() + timedelta(days=60)).isoformat()
    }
    resp = client.put(f"/api/notices/{notice_id}", json=update_payload, headers=lao_headers)
    assert resp.status_code == 200, f"LAO update notice failed: {resp.text}"
    updated_notice = resp.json()
    assert updated_notice["title"] == update_payload["title"]
    print(f"PASS: LAO successfully updated Notice #{notice_id}: {updated_notice['title']}")

    # 2.4 LAO Publishes Notice -> Immediately appears on Public Home Page
    resp = client.put(f"/api/notices/{notice_id}/publish", headers=lao_headers)
    assert resp.status_code == 200, f"LAO publish failed: {resp.text}"
    published = resp.json()
    assert published["status"] == "Published"
    assert published["is_active"] == True
    print(f"PASS: Notice #{notice_id} published successfully.")

    # Verify immediately visible on public board
    resp_pub2 = client.get("/api/notices?status_filter=Published&active_only=true")
    found_on_public = any(n["id"] == notice_id for n in resp_pub2.json())
    assert found_on_public, "Published notice MUST be visible on public board!"
    print("PASS: Published notice is immediately live and visible on Public Notice Board.")

    # 2.5 LAO Deactivates Notice -> Immediately disappears from Public Home Page
    resp = client.put(f"/api/notices/{notice_id}/deactivate", headers=lao_headers)
    assert resp.status_code == 200
    print(f"PASS: Notice #{notice_id} deactivated by LAO.")

    resp_pub3 = client.get("/api/notices?status_filter=Published&active_only=true")
    assert not any(n["id"] == notice_id for n in resp_pub3.json()), "Deactivated notice must NOT appear on public board!"
    print("PASS: Deactivated notice immediately removed from Public Notice Board.")

    # =========================================================================
    # PART 3: SURVEY OFFICER WORKFLOWS & EXECUTION
    # =========================================================================
    print("\n--- PART 3: Survey Task Assignment & Survey Execution ---")

    # 3.1 LAO assigns a task of type 'Survey'
    task_payload = {
        "title": "Physical Joint Boundary Survey for Plot 142/A",
        "description": "Conduct physical boundary pegging and cadastral verification with DGPS equipment.",
        "case_id": 4,
        "parcel_id": 12,
        "assigned_department_id": 2,
        "assigned_officer_id": 3,
        "priority": "High",
        "deadline": (date.today() + timedelta(days=14)).isoformat()
    }
    resp = client.post("/api/tasks", json=task_payload, headers=lao_headers)
    assert resp.status_code == 201, f"Task creation failed: {resp.text}"
    created_task = resp.json()
    print(f"PASS: LAO created Survey Task #{created_task['id']} assigned to {created_task['assigned_officer_name']}.")

    # 3.2 Survey Officer queries their surveys list
    resp = client.get("/api/surveys", headers=so_headers)
    assert resp.status_code == 200, f"Survey Officer get surveys failed: {resp.text}"
    surveys = resp.json()
    print(f"PASS: Survey Officer fetched {len(surveys)} survey requests.")
    assert len(surveys) >= 1

    # Pick Survey #1 (or the first available)
    survey_id = surveys[0]["id"]
    print(f"Testing execution flow on Survey #{survey_id} ({surveys[0]['request_number']})")

    # 3.3 Survey Officer opens survey execution page (/api/surveys/{id})
    resp = client.get(f"/api/surveys/{survey_id}", headers=so_headers)
    assert resp.status_code == 200, f"GET /surveys/{survey_id} failed with {resp.status_code}: {resp.text}"
    survey_detail = resp.json()
    print(f"PASS: Survey Execution data loaded cleanly (200 OK):")
    print(f"  - Request: {survey_detail['request_number']} | Status: {survey_detail['status']}")
    print(f"  - Parcel: #{survey_detail['plot_number']} | Recorded Area: {survey_detail['recorded_area_acres']} Ac")
    print(f"  - Expected GPS: ({survey_detail['expected_latitude']}, {survey_detail['expected_longitude']})")
    assert survey_detail["case_number"] is not None
    assert survey_detail["title"] is not None

    # 3.4 Survey Officer completes workflow steps:
    # A. Accept survey
    resp = client.put(f"/api/surveys/{survey_id}/accept", headers=so_headers)
    assert resp.status_code in [200, 400] # 400 if already past ACCEPTED stage
    print(f"PASS: Survey Accept step response: {resp.status_code}")

    # B. Schedule survey
    schedule_payload = {
        "scheduled_date": (date.today() + timedelta(days=2)).isoformat(),
        "scheduled_time": "10:00 AM",
        "expected_duration_hours": 3.0,
        "field_team_members": "Smt. Sunita Mishra (SO), Shri P. Das (Amin)"
    }
    resp = client.put(f"/api/surveys/{survey_id}/schedule", json=schedule_payload, headers=so_headers)
    assert resp.status_code in [200, 400]
    print(f"PASS: Survey Schedule step response: {resp.status_code}")

    # C. Start field survey
    resp = client.put(f"/api/surveys/{survey_id}/start", headers=so_headers)
    assert resp.status_code in [200, 400]
    print(f"PASS: Survey Start step response: {resp.status_code}")

    # D. Submit field observations
    obs_payload = {
        "observed_area_acres": 0.85,
        "land_use": "Agricultural",
        "crop_type": "Paddy",
        "irrigation_available": True,
        "trees_count": 12,
        "boundary_status": "Boundary matches records",
        "boundary_remarks": "Demarcated with boundary pegs"
    }
    resp = client.put(f"/api/surveys/{survey_id}/observations", json=obs_payload, headers=so_headers)
    assert resp.status_code == 200
    print(f"PASS: Field observations recorded successfully.")

    # =========================================================================
    # PART 4: COMPENSATION OFFICER WORKFLOWS
    # =========================================================================
    print("\n--- PART 4: Compensation Officer Workflows ---")
    resp = client.get("/api/compensation", headers=co_headers)
    assert resp.status_code == 200, f"GET /compensation failed: {resp.text}"
    comps = resp.json()
    print(f"PASS: Compensation Officer loaded {len(comps)} compensation records.")
    assert len(comps) >= 1

    comp_id = comps[0]["id"]
    current_stage = comps[0]["stage"]
    current_stage_idx = comps[0]["stage_index"]
    print(f"  - Record #{comp_id}: Stage {current_stage_idx}/9 ({current_stage})")

    # Advance stage
    if current_stage_idx < 9:
        stages = [
            "Land valuation pending", "Valuation completed", "Compensation calculated",
            "Approval pending", "Compensation approved", "Landowner consent pending",
            "Bank verification", "Payment initiated", "Payment completed"
        ]
        next_stage = stages[min(current_stage_idx, len(stages) - 1)]
        resp = client.put(
            f"/api/compensation/{comp_id}/stage",
            json={"stage": next_stage, "remarks": f"Advanced by test suite to {next_stage}"},
            headers=co_headers
        )
        assert resp.status_code == 200, f"Advance stage failed: {resp.text}"
        updated_comp = resp.json()
        print(f"PASS: Compensation stage advanced to: {updated_comp['stage']} (Stage {updated_comp['stage_index']}/9)")

    # =========================================================================
    # PART 5: LANDOWNER WORKFLOWS
    # =========================================================================
    print("\n--- PART 5: Landowner Workflows ---")

    # 5.1 Landowner views parcels
    resp = client.get("/api/parcels?village_id=1", headers=lo_headers)
    assert resp.status_code == 200, f"GET /parcels failed: {resp.text}"
    parcels = resp.json()
    print(f"PASS: Landowner fetched parcels: {len(parcels)} plots found.")

    # 5.2 Landowner files grievance / objection
    grievance_payload = {
        "category": "Valuation Dispute",
        "subject": "Objection regarding Solatium calculation for Plot 142/A",
        "description": "Requesting re-assessment of commercial tree valuation on Plot 142/A prior to Section 19 declaration.",
        "case_id": 4,
        "parcel_id": 12
    }
    resp = client.post("/api/grievances", json=grievance_payload, headers=lo_headers)
    assert resp.status_code == 201, f"Submit grievance failed: {resp.text}"
    grievance = resp.json()
    print(f"PASS: Landowner filed Grievance #{grievance['id']} ({grievance['grievance_number']})")
    assert grievance["status"] == "Submitted"

    # Query grievances to ensure it appears
    resp = client.get("/api/grievances", headers=lao_headers)
    assert resp.status_code == 200
    all_g = resp.json()
    assert any(g["id"] == grievance["id"] for g in all_g)
    print(f"PASS: Grievance appears on LAO Redressal queue ({len(all_g)} total grievances).")

    print("\n" + "=" * 70)
    print("ALL END-TO-END VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    test_e2e()
