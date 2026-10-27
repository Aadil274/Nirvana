"""
Nirvana Stage 1 Verification Suite:
Core Networking, CORS Security & API Routing
"""

import sys
import os
import unittest
from starlette.testclient import TestClient

# Add project root to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from api.main import app

class TestStage1Networking(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_cors_allowed_origin(self):
        """Verify allowed origin receives appropriate CORS headers with credentials enabled"""
        response = self.client.options(
            "/api/v1/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET"
            }
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), "http://localhost:3000")
        self.assertEqual(response.headers.get("access-control-allow-credentials"), "true")

    def test_cors_disallowed_origin(self):
        """Verify unauthorized origin does not receive access-control-allow-origin matching malicious site"""
        response = self.client.options(
            "/api/v1/health",
            headers={
                "Origin": "https://malicious-phishing-site.com",
                "Access-Control-Request-Method": "GET"
            }
        )
        # In Starlette CORSMiddleware, disallowed origin does not get access-control-allow-origin back
        allow_origin = response.headers.get("access-control-allow-origin")
        self.assertNotEqual(allow_origin, "https://malicious-phishing-site.com")
        self.assertNotEqual(allow_origin, "*")

    def test_no_wildcard_credentials(self):
        """Verify that wildcard origins are never combined with allow_credentials=True"""
        response = self.client.get(
            "/api/v1/health",
            headers={"Origin": "http://localhost:3000"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response.headers.get("access-control-allow-origin"), "*")

    def test_api_v1_endpoints_live(self):
        """Verify all primary v1 endpoints respond without pathing issues"""
        endpoints = [
            "/api/v1/health",
            "/api/v1/data-sources/status",
            "/api/v1/shelters",
            "/api/v1/reports",
            "/api/v1/alerts",
            "/api/v1/dashboard/kpis",
            "/api/v1/risk/wards?horizon=now"
        ]
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 200, f"Endpoint {ep} failed with {res.status_code}")

    def test_path_duplication_prevented(self):
        """Verify that duplicated /api/v1/api/v1 path returns 404, confirming single path contract"""
        res = self.client.get("/api/v1/api/v1/health")
        self.assertEqual(res.status_code, 404)

if __name__ == "__main__":
    unittest.main()
