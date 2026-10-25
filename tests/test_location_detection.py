import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from api.main import app

def test_location_detection_endpoints():
    client = TestClient(app)

    # 1. In-city coordinates: Tolichowki / Nadeem Colony (17.3820, 78.4230)
    res_in_city = client.get("/api/v1/risk?lat=17.3820&lng=78.4230")
    assert res_in_city.status_code == 200, f"Expected 200, got {res_in_city.status_code}"
    data_in = res_in_city.json()
    assert data_in["lat"] == 17.3820
    assert data_in["lng"] == 78.4230
    assert data_in["ward_id"] == "ward-72"
    assert data_in["distance_to_ward_km"] < 1.0
    assert "flood" in data_in and "score" in data_in["flood"]
    print("PASS: In-city coordinates test passed:", data_in["ward_name"], f"(dist={data_in['distance_to_ward_km']}km)")

    # 2. Out-of-city / Global coordinates: Bengaluru (12.9716, 77.5946)
    # Crucial test: Previously failed with 422 due to narrow 17.0-18.0 ge/le bounds!
    res_out_city = client.get("/api/v1/risk?lat=12.9716&lng=77.5946")
    assert res_out_city.status_code == 200, f"Expected 200 for external coordinates, got {res_out_city.status_code}"
    data_out = res_out_city.json()
    assert data_out["lat"] == 12.9716
    assert data_out["lng"] == 77.5946
    assert data_out["distance_to_ward_km"] > 400.0  # ~490 km from Hyderabad
    assert data_out["coverage_note"] is not None
    print("PASS: Out-of-city coordinates test passed:", data_out["coverage_note"])

    # 3. Coordinate validation: Out of range coordinates should return 422
    res_invalid_lat = client.get("/api/v1/risk?lat=95.0&lng=78.4230")
    assert res_invalid_lat.status_code == 422, "Lat > 90 must return 422"

    res_invalid_lng = client.get("/api/v1/risk?lat=17.3820&lng=200.0")
    assert res_invalid_lng.status_code == 422, "Lng > 180 must return 422"
    print("PASS: Boundary validation tests passed (422 on invalid coords)")

    # 4. Shelters endpoint distance calculations based on coordinates
    shelters_point_a = client.get("/api/v1/shelters?lat=17.3616&lng=78.4747").json() # Charminar
    shelters_point_b = client.get("/api/v1/shelters?lat=17.4440&lng=78.4680").json() # Begumpet

    assert len(shelters_point_a) > 0 and len(shelters_point_b) > 0
    # The closest shelter to Charminar should NOT be the closest to Begumpet
    assert shelters_point_a[0]["id"] != shelters_point_b[0]["id"]
    print("PASS: Dynamic shelter proximity test passed:",
          f"Charminar nearest={shelters_point_a[0]['name']} ({shelters_point_a[0]['distance_km']}km) vs",
          f"Begumpet nearest={shelters_point_b[0]['name']} ({shelters_point_b[0]['distance_km']}km)")

    # 5. Forecast endpoint accepting real coordinates without 422
    forecast_res = client.get("/api/v1/forecast?lat=12.9716&lng=77.5946")
    assert forecast_res.status_code == 200
    forecast_data = forecast_res.json()
    assert forecast_data["lat"] == 12.9716
    assert "current" in forecast_data
    print("PASS: Forecast endpoint test passed with external coordinates")

    print("\nALL LOCATION DETECTION REGRESSION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_location_detection_endpoints()
