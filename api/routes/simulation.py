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
    """
    rain = payload.rainfall_rate_mm_hr
    temp = payload.temperature_c

    # Dynamic impact calculations
    if rain >= 80:
        severe_count = 14
        affected_pop = 780000
        overall_severity = "Severe"
    elif rain >= 50:
        severe_count = 6
        affected_pop = 340000
        overall_severity = "High"
    elif rain >= 25:
        severe_count = 2
        affected_pop = 95000
        overall_severity = "Moderate"
    else:
        severe_count = 0
        affected_pop = 15000
        overall_severity = "Low"

    return {
        "simulation_inputs": {
            "rainfall_rate_mm_hr": rain,
            "temperature_c": temp,
            "drainage_blockage_pct": payload.drainage_blockage_pct
        },
        "projected_impact": {
            "overall_severity": overall_severity,
            "wards_at_severe": severe_count,
            "people_at_risk": affected_pop,
            "recommended_pumps": max(4, int(severe_count * 1.5)),
            "shelters_to_activate": max(3, severe_count * 2)
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
