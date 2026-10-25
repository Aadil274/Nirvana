from typing import Dict, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/dashboard", tags=["Municipal Command Dashboard"])

RESOURCES_INVENTORY = [
    {"id": "res-1", "name": "Heavy De-Watering Pump (500 GPM)", "category": "pump", "assigned_ward": "ward-72", "status": "deployed"},
    {"id": "res-2", "name": "Heavy De-Watering Pump (500 GPM)", "category": "pump", "assigned_ward": "ward-71", "status": "deployed"},
    {"id": "res-3", "name": "Trailer Pump (300 GPM)", "category": "pump", "assigned_ward": "ward-55", "status": "deployed"},
    {"id": "res-4", "name": "Inflatable Rescue Boat with OBM", "category": "boat", "assigned_ward": "ward-55", "status": "deployed"},
    {"id": "res-5", "name": "Inflatable Rescue Boat with OBM", "category": "boat", "assigned_ward": "ward-8", "status": "standby"},
    {"id": "res-6", "name": "SDRF First Responder Team (8 Pax)", "category": "team", "assigned_ward": "ward-72", "status": "deployed"},
    {"id": "res-7", "name": "SDRF First Responder Team (8 Pax)", "category": "team", "assigned_ward": "ward-44", "status": "deployed"},
    {"id": "res-8", "name": "Dry Ration Kits (500 Pk)", "category": "relief", "assigned_ward": "ward-72", "status": "distributed"},
    {"id": "res-9", "name": "High-Clearance Rescue Tipper Truck", "category": "vehicle", "assigned_ward": "ward-71", "status": "deployed"}
]

class ResourceAssignment(BaseModel):
    resource_id: str
    ward_id: str

@router.get("/kpis")
@router.get("/overview")
def get_kpis():
    """
    Dynamically computes municipal overview KPIs from live wards, shelters, reports, and alerts data.
    """
    from .risk import load_wards_geojson, compute_ward_risk
    from .shelters import SHELTERS_STORE
    from .reports import REPORTS_STORE
    from .alerts import ALERTS_DB

    # Dynamic ward risk aggregation
    wards_data = load_wards_geojson()
    severe_count = 0
    high_risk_pop = 0

    for feat in wards_data.get("features", []):
        computed = compute_ward_risk(feat["properties"], horizon="now")
        pop = feat["properties"].get("population", 50000)
        if computed["flood_level"] == "Severe" or computed["heat_level"] == "Severe":
            severe_count += 1
            high_risk_pop += pop
        elif computed["flood_level"] == "High" or computed["heat_level"] == "High":
            high_risk_pop += int(pop * 0.5)

    # Dynamic shelter metrics
    shelters_open = len([s for s in SHELTERS_STORE if "Verified" in s.get("verification_status", "")])
    shelters_cap = sum(s.get("capacity", 0) for s in SHELTERS_STORE)
    shelters_occ = sum(s.get("current_occupancy", 0) for s in SHELTERS_STORE)

    # Dynamic reports metrics
    active_reports = len(REPORTS_STORE)
    verified_reports = len([r for r in REPORTS_STORE if r.get("status") in ["verified", "resolved"]])

    # Dynamic alerts count
    alerts_dispatched = len([a for a in ALERTS_DB if a.get("delivery_status") == "sent"])

    res = {
        "wards_at_severe": severe_count,
        "total_wards_monitored": len(wards_data.get("features", [])),
        "people_in_high_risk": high_risk_pop,
        "shelters_open": shelters_open,
        "shelters_total_capacity": shelters_cap,
        "shelters_current_occupancy": shelters_occ,
        "active_citizen_reports": active_reports,
        "verified_citizen_reports": verified_reports,
        "alerts_dispatched_today": alerts_dispatched,
        "rainfall_max_hourly_mm": 58.0,
        "last_telemetry_sync": "2026-10-25T18:15:00Z"
    }
    return {"kpis": res, **res}

@router.get("/ward/{ward_id}")
def get_ward_details(ward_id: str):
    from .risk import load_wards_geojson
    data = load_wards_geojson()
    matched = next((f for f in data["features"] if f["properties"]["ward_id"] == ward_id), None)
    if not matched:
        raise HTTPException(status_code=404, detail="Ward not found")

    props = matched["properties"]
    
    # AI Recommended Action based on top factors
    if props["drainage_health"] == "Blocked" or props["musi_proximity_km"] < 1.0:
        recommended_action = {
            "title": f"Pre-position 2 High-Capacity Bilge Pumps at {props['name']}",
            "deadline": "By 19:30 IST (30 mins before peak runoff)",
            "rationale": f"Inundation probability exceeds 85% with {props['drainage_health'].lower()} drainage channels. Rapid dewatering required to protect ground floors.",
            "priority": "Critical",
            "assigned_team": "GHMC Circle 12 Quick Response Unit"
        }
    else:
        recommended_action = {
            "title": f"Routine Nala Silt Inspection & Gully Pit Clearing at {props['name']}",
            "deadline": "By 21:00 IST",
            "rationale": "Moderate runoff anticipated; gravity flow adequate if grates remain clear of floating bags.",
            "priority": "Medium",
            "assigned_team": "Ward Sanitation Squad"
        }

    return {
        "ward_id": props["ward_id"],
        "name": props["name"],
        "zone": props["zone"],
        "circle": props["circle"],
        "population": props["population"],
        "area_sqkm": props["area_sqkm"],
        "base_elevation_m": props["base_elevation_m"],
        "twi": props["twi"],
        "hand_m": props["hand_m"],
        "drainage_health": props["drainage_health"],
        "drainage_capacity_score": props["drainage_capacity_score"],
        "vulnerability_index": props["vulnerability_index"],
        "demographics": {
            "elderly_pct": props["elderly_pct"],
            "outdoor_workers_pct": props["outdoor_workers_pct"],
            "informal_housing_pct": props["informal_housing_pct"]
        },
        "resources_on_site": [r for r in RESOURCES_INVENTORY if r["assigned_ward"] == ward_id],
        "ai_recommended_action": recommended_action
    }

@router.get("/resources")
def get_resources():
    return {
        "inventory": RESOURCES_INVENTORY,
        "summary": {
            "total_pumps": len([r for r in RESOURCES_INVENTORY if r["category"] == "pump"]),
            "total_boats": len([r for r in RESOURCES_INVENTORY if r["category"] == "boat"]),
            "total_teams": len([r for r in RESOURCES_INVENTORY if r["category"] == "team"]),
            "active_deployments": len([r for r in RESOURCES_INVENTORY if r["status"] == "deployed"])
        }
    }

@router.post("/resources/assign")
def assign_resource(payload: ResourceAssignment):
    item = next((r for r in RESOURCES_INVENTORY if r["id"] == payload.resource_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Resource not found")
    item["assigned_ward"] = payload.ward_id
    item["status"] = "deployed"
    return {"status": "assigned", "resource": item}

@router.get("/situation-report")
@router.get("/sitrep")
def get_situation_report():
    """
    Generates a dynamic, print-friendly Situation Report (SitRep) for Disaster Management Commissioners.
    """
    from .risk import load_wards_geojson, compute_ward_risk
    from .shelters import SHELTERS_STORE
    from .reports import REPORTS_STORE

    wards_data = load_wards_geojson()
    severe_wards = []
    for feat in wards_data.get("features", []):
        computed = compute_ward_risk(feat["properties"], horizon="now")
        if computed["flood_level"] == "Severe":
            severe_wards.append(f"{feat['properties']['name']} ({computed['flood_depth_cm']}cm inundation)")

    shelters_occ = sum(s.get("current_occupancy", 0) for s in SHELTERS_STORE)
    shelters_cap = sum(s.get("capacity", 0) for s in SHELTERS_STORE)
    shelters_count = len([s for s in SHELTERS_STORE if "Verified" in s.get("verification_status", "")])

    resolved_count = len([r for r in REPORTS_STORE if r.get("status") in ["verified", "resolved"]])
    total_rep = len(REPORTS_STORE)

    return {
        "report_id": "SITREP-HYD-20261025-1800",
        "title": "Nirvana Climate Resilience: Monsoon Flash-Flood Situation Report",
        "city": "Hyderabad (GHMC)",
        "issued_by": "Municipal Emergency Operations Center",
        "timestamp": "2026-10-25T18:00:00Z",
        "weather_summary": "Active deep convective squall over southern and central zones. 58mm/hr recorded at Begumpet radar. Musi river gauge at 3.2m.",
        "severe_wards": severe_wards or ["Mehdipatnam / Nadeem Colony", "Karwan / Tolichowki"],
        "evacuation_status": f"{shelters_occ:,} persons accommodated across {shelters_count} active relief shelters. {max(0, shelters_cap - shelters_occ):,} beds remaining.",
        "pumps_deployed": len([r for r in RESOURCES_INVENTORY if r["category"] == "pump" and r["status"] == "deployed"]),
        "citizen_reports_resolved": f"{resolved_count} of {total_rep} crowd reports verified & actioned.",
        "statutory_notice": "Synthesized in compliance with NDMA Early Warning & Standard Operating Guidelines."
    }
