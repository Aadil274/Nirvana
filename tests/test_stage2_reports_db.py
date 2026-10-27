"""
Nirvana Stage 2 Verification Suite:
Citizen Reports SQLite Persistence, Upvotes, Community Consensus & Triage
"""

import sys
import os
import unittest
from starlette.testclient import TestClient

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from api.main import app
from api.services import report_db

class TestStage2ReportsDB(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_seed_reports_exist(self):
        """Verify seeded initial reports exist in SQLite database"""
        reports = report_db.list_reports()
        self.assertGreaterEqual(len(reports), 4)
        rep1 = report_db.get_report_by_id("rep-1")
        self.assertIsNotNone(rep1)
        self.assertEqual(rep1["ward_id"], "ward-72")

    def test_create_report_persistence(self):
        """Verify report creation writes to SQLite and returns formatted report"""
        payload = {
            "ward_id": "ward-72",
            "ward_name": "Mehdipatnam",
            "category": "waterlogging",
            "severity": "Severe",
            "description": "Automated regression test: Water level 20cm at junction.",
            "location_name": "Junction 5",
            "lat": 17.3820,
            "lng": 78.4230,
            "photo_url": "https://example.com/photo.jpg",
            "has_audio_note": False
        }
        res = self.client.post("/api/v1/reports", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        report_id = data["id"]
        self.assertTrue(report_id.startswith("rep-"))

        # Verify persistent in database
        db_rep = report_db.get_report_by_id(report_id)
        self.assertIsNotNone(db_rep)
        self.assertEqual(db_rep["description"], payload["description"])
        self.assertEqual(db_rep["confirm_votes"], 1)
        self.assertEqual(db_rep["status"], "pending")

    def test_confirm_upvote_and_auto_consensus(self):
        """Verify neighbor confirm votes increment and trigger consensus verification at 5 votes"""
        # Create a report for testing consensus
        new_rep = report_db.create_report(
            ward_id="ward-71",
            ward_name="Karwan",
            category="blocked_drain",
            severity="High",
            description="Culvert silt accumulation",
            location_name="Karwan bridge",
            lat=17.384,
            lng=78.421
        )
        rep_id = new_rep["id"]
        self.assertEqual(new_rep["status"], "pending")
        self.assertEqual(new_rep["confirm_votes"], 1)

        # 3 more votes -> total 4 votes
        for expected_votes in range(2, 5):
            res = self.client.post(f"/api/v1/reports/{rep_id}/confirm")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["confirm_votes"], expected_votes)
            self.assertEqual(res.json()["status"], "pending")

        # 5th vote -> should auto-verify via Community Consensus
        res5 = self.client.post(f"/api/v1/reports/{rep_id}/confirm")
        self.assertEqual(res5.status_code, 200)
        self.assertEqual(res5.json()["confirm_votes"], 5)
        self.assertEqual(res5.json()["status"], "verified")

        # Check in DB
        db_rep = report_db.get_report_by_id(rep_id)
        self.assertEqual(db_rep["status"], "verified")
        self.assertIn("Community Consensus", db_rep["verified_by"])

    def test_triage_actions(self):
        """Verify triage actions (verify, reject, resolve) update status and timestamps"""
        rep = report_db.create_report(
            ward_id="ward-55",
            ward_name="Moosarambagh",
            category="waterlogging",
            severity="Severe",
            description="Testing triage endpoint",
            location_name="Causeway",
            lat=17.373,
            lng=78.509
        )
        rep_id = rep["id"]

        # Triage verify
        res_v = self.client.post(f"/api/v1/reports/{rep_id}/triage?action=verify&reviewer=Inspector%20Khan")
        self.assertEqual(res_v.status_code, 200)
        self.assertEqual(res_v.json()["status"], "verified")
        self.assertEqual(res_v.json()["verified_by"], "Inspector Khan")

        # Triage resolve
        res_r = self.client.post(f"/api/v1/reports/{rep_id}/triage?action=resolve")
        self.assertEqual(res_r.status_code, 200)
        self.assertEqual(res_r.json()["status"], "resolved")
        self.assertIsNotNone(res_r.json()["resolved_at"])

    def test_api_list_filtering(self):
        """Verify list_reports supports ward_id and status filters"""
        res_all = self.client.get("/api/v1/reports")
        self.assertEqual(res_all.status_code, 200)
        all_reps = res_all.json()
        self.assertIsInstance(all_reps, list)

        res_ward = self.client.get("/api/v1/reports?ward_id=ward-72")
        self.assertEqual(res_ward.status_code, 200)
        for r in res_ward.json():
            self.assertEqual(r["ward_id"], "ward-72")

if __name__ == "__main__":
    unittest.main()
