import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from api.main import app

def test_dynamic_sensitivity():
    client = TestClient(app)

    # 1. Rain simulation sensitivity
    r_low = client.get("/api/v1/risk/wards?simulated_rain_mm=10").json()
    r_high = client.get("/api/v1/risk/wards?simulated_rain_mm=120").json()
    avg_f_low = sum(f["properties"]["flood_score"] for f in r_low["features"]) / len(r_low["features"])
    avg_f_high = sum(f["properties"]["flood_score"] for f in r_high["features"]) / len(r_high["features"])
    print(f"Average Flood Score: 10mm={avg_f_low:.1f} vs 120mm={avg_f_high:.1f}")
    assert avg_f_high > avg_f_low + 30, "Flood score must scale dynamically with rain"

    # 2. Temperature simulation sensitivity
    t_low = client.get("/api/v1/risk/wards?simulated_temp_c=26").json()
    t_high = client.get("/api/v1/risk/wards?simulated_temp_c=47").json()
    avg_h_low = sum(f["properties"]["heat_score"] for f in t_low["features"]) / len(t_low["features"])
    avg_h_high = sum(f["properties"]["heat_score"] for f in t_high["features"]) / len(t_high["features"])
    print(f"Average Heat Score: 26C={avg_h_low:.1f} vs 47C={avg_h_high:.1f}")
    assert avg_h_high > avg_h_low + 30, "Heat score must scale dynamically with temperature"

    # 3. What-if simulation
    p1 = {"rainfall_rate_mm_hr": 15.0, "temperature_c": 30.0, "drainage_blockage_pct": 0.0}
    p2 = {"rainfall_rate_mm_hr": 110.0, "temperature_c": 45.0, "drainage_blockage_pct": 80.0}
    sim_light = client.post("/api/v1/simulate", json=p1).json()["projected_impact"]
    sim_heavy = client.post("/api/v1/simulate", json=p2).json()["projected_impact"]
    print("Sim light impact:", sim_light)
    print("Sim heavy impact:", sim_heavy)
    assert sim_heavy["wards_at_severe"] > sim_light["wards_at_severe"]
    assert sim_heavy["people_at_risk"] > sim_light["people_at_risk"]

    # 4. Nearest shelter distance calculation
    s1 = client.get("/api/v1/shelters?lat=17.382&lng=78.423").json()
    s2 = client.get("/api/v1/shelters?lat=17.445&lng=78.520").json()
    print("Nearest shelter at loc 1:", s1[0]["name"], s1[0]["distance_km"], "km")
    print("Nearest shelter at loc 2:", s2[0]["name"], s2[0]["distance_km"], "km")
    assert s1[0]["id"] != s2[0]["id"]

    # 5. Explainability attribution
    exp = client.get("/api/v1/risk/explain?cell_id=ward-72").json()
    factors = exp["explainability"]["top_contributing_factors"]
    total_pct = sum(f["contribution_pct"] for f in factors)
    print(f"Explainability factors for Ward-72 (total={total_pct:.1f}%):")
    for f in factors:
        print(f"  - {f['factor']}: {f['contribution_pct']}% (value: {f['value']})")
    assert 98.0 <= total_pct <= 102.0

    print("ALL DYNAMIC CALCULATIONS & SENSITIVITIES CONFIRMED!")

if __name__ == "__main__":
    test_dynamic_sensitivity()
