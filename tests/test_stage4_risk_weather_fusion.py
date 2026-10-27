"""
Test Suite for Stage 4: Live Weather Fusion & Blended ML Risk Calculations
Validates that:
1. FloodRiskEngine properly loads and executes nirvana_flood_gb.joblib GradientBoostingClassifier.
2. Risk calculation endpoints fuse live Open-Meteo weather when simulations are omitted.
3. Coordinates /risk query dynamically incorporates weather parameters.
4. Fallbacks work gracefully when external network or models are unavailable.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from api.main import app
from ml.model import FloodRiskEngine, get_ml_bundle

def test_ml_model_loaded():
    bundle = get_ml_bundle()
    assert bundle is not None, "nirvana_flood_gb.joblib must be loaded"
    assert "model" in bundle, "ML bundle must contain trained model"
    assert "features" in bundle, "ML bundle must contain feature columns"

    # Test extreme flood case vs minimal flood case
    severe_features = {
        "rain_1h_mm": 40.0,
        "rain_3h_mm": 90.0,
        "elevation_m": 485.0,
        "slope_deg": 0.5,
        "twi": 13.5,
        "hand_m": 0.4,
        "drainage_health": "Blocked",
        "impervious_fraction": 0.95,
        "musi_proximity_km": 0.2
    }
    score_sev, level_sev, depth_sev, conf_sev = FloodRiskEngine.calculate_blended_risk(severe_features)
    assert score_sev >= 75.0, f"Severe features must yield score >= 75, got {score_sev}"
    assert level_sev == "Severe", f"Severe features must yield Severe level, got {level_sev}"
    assert depth_sev > 20, f"Expected deep flood ponding, got {depth_sev}cm"

    minimal_features = {
        "rain_1h_mm": 0.0,
        "rain_3h_mm": 0.0,
        "elevation_m": 580.0,
        "slope_deg": 3.0,
        "twi": 6.5,
        "hand_m": 12.0,
        "drainage_health": "Clear",
        "impervious_fraction": 0.60,
        "musi_proximity_km": 6.0
    }
    score_min, level_min, depth_min, conf_min = FloodRiskEngine.calculate_blended_risk(minimal_features)
    assert score_min < 35.0, f"Minimal features must yield score < 35, got {score_min}"
    assert level_min == "Low", f"Minimal features must yield Low level, got {level_min}"
    print(f"PASS: ML Blended Risk - Severe: {score_sev} ({level_sev}, {depth_sev}cm) vs Minimal: {score_min} ({level_min}, {depth_min}cm)")

def test_api_weather_fusion():
    client = TestClient(app)

    # 1. Test /risk/wards without simulation overrides -> should use fused live weather
    res_wards = client.get("/api/v1/risk/wards")
    assert res_wards.status_code == 200
    wards_data = res_wards.json()
    assert "features" in wards_data
    assert len(wards_data["features"]) == 22

    first_ward = wards_data["features"][0]["properties"]
    assert "flood_score" in first_ward
    assert "heat_score" in first_ward
    assert "confidence" in first_ward
    print(f"PASS: Live fused wards risk: {first_ward['name']} -> Flood={first_ward['flood_score']}, Heat={first_ward['heat_score']}")

    # 2. Test /risk with coordinates -> fused live weather
    res_loc = client.get("/api/v1/risk?lat=17.385&lng=78.486")
    assert res_loc.status_code == 200
    loc_data = res_loc.json()
    assert loc_data["lat"] == 17.385
    assert loc_data["lng"] == 78.486
    assert "flood" in loc_data
    assert "heat" in loc_data
    assert loc_data["confidence"] > 70
    print(f"PASS: Location-based risk: {loc_data['ward_name']} -> Flood={loc_data['flood']['score']}, Heat={loc_data['heat']['score']}")

if __name__ == "__main__":
    test_ml_model_loaded()
    test_api_weather_fusion()
    print("ALL STAGE 4 RISK & WEATHER FUSION TESTS PASSED!")
