from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="", tags=["Simulation & Demo Scenarios"])

class WhatIfSimulationRequest(BaseModel):
    rainfall_rate_mm_hr: float = 45.0
    temperature_c: float = 34.0
    drainage_blockage_pct: float = 25.0

CURRENT_SCENARIO = {
    "active": False,
    "scenario_name": None,
    "step": 0,
    "max_steps": 4
}

@router.post("/simulate")
def run_what_if_simulation(payload: WhatIfSimulationRequest):
    """
    Simulates projected street-level flood and heat risk based on user-controlled sliders.
    Dynamically computes impacts across all 22 wards from real spatial data.
    """
    from .risk import load_wards_geojson, compute_ward_risk

    rain = payload.rainfall_rate_mm_hr
    temp = payload.temperature_c
    blockage = payload.drainage_blockage_pct

    wards_data = load_wards_geojson()
    severe_count = 0
    high_count = 0
    affected_pop = 0

    for feat in wards_data.get("features", []):
        props = dict(feat["properties"])
        # Adjust drainage health if user increased blockage
        if blockage >= 60:
            props["drainage_health"] = "Blocked"
        elif blockage >= 30 and props["drainage_health"] == "Clear":
            props["drainage_health"] = "Partially Blocked"

        computed = compute_ward_risk(props, horizon="now", simulated_rain_mm=rain, simulated_temp_c=temp)
        f_score = computed["flood_score"]
        h_score = computed["heat_score"]
        pop = props.get("population", 50000)

        if f_score >= 75 or h_score >= 75:
            severe_count += 1
            affected_pop += pop
        elif f_score >= 55 or h_score >= 55:
            high_count += 1
            affected_pop += int(pop * 0.5)

    if severe_count >= 5:
        overall_severity = "Severe"
    elif severe_count >= 2 or high_count >= 6:
        overall_severity = "High"
    elif high_count >= 2:
        overall_severity = "Moderate"
    else:
        overall_severity = "Low"

    return {
        "simulation_inputs": {
            "rainfall_rate_mm_hr": rain,
            "temperature_c": temp,
            "drainage_blockage_pct": blockage
        },
        "projected_impact": {
            "overall_severity": overall_severity,
            "wards_at_severe": severe_count,
            "wards_at_high": high_count,
            "people_at_risk": affected_pop,
            "recommended_pumps": max(2, int(severe_count * 2 + high_count)),
            "shelters_to_activate": max(2, int(severe_count * 2.5 + 1))
        }
    }

@router.post("/demo/scenario/start")
def start_demo_scenario(scenario_type: str = "heavy_rain_hyderabad"):
    """
    Triggers an automated presentation demo scenario.
    - heavy_rain_hyderabad: simulates a 3-hour deluge rising in Nadeem Colony, Moosarambagh, and Karwan
    - heatwave_oldcity: simulates severe 44C heatwave in Charminar
    """
    CURRENT_SCENARIO["active"] = True
    CURRENT_SCENARIO["scenario_name"] = scenario_type
    CURRENT_SCENARIO["step"] = 1

    return {
        "status": "scenario_started",
        "scenario": scenario_type,
        "description": "Simulating a 3-hour heavy-rain build-up over Hyderabad. Wards animating to Severe, automated alerts dispatched, shelters activated.",
        "timeline_steps": [
            {"time": "T+0h", "rain_mm": "25mm/hr", "status": "Moderate alerts in low-lying pockets"},
            {"time": "T+1h", "rain_mm": "58mm/hr", "status": "Shah Hatim nala overflow, Nadeem Colony Severe"},
            {"time": "T+2h", "rain_mm": "85mm/hr", "status": "Musi river causeway surge, Moosarambagh evacuated"},
            {"time": "T+3h", "rain_mm": "110mm/hr", "status": "Citywide emergency protocol, all 16 shelters full capacity"}
        ]
    }

@router.post("/demo/scenario/stop")
def stop_demo_scenario():
    CURRENT_SCENARIO["active"] = False
    CURRENT_SCENARIO["scenario_name"] = None
    CURRENT_SCENARIO["step"] = 0
    return {"status": "scenario_stopped", "message": "Reset to baseline telemetry."}
