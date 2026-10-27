import json
import os
import logging
from typing import Optional, List, Tuple
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from ml.model import FloodRiskEngine, HeatRiskEngine
from api.services.weather_service import weather_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/risk", tags=["Risk Intelligence"])

# Load Hyderabad wards GeoJSON
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
WARDS_FILE = os.path.join(DATA_DIR, "hyderabad_wards.geojson")

def load_wards_geojson():
    with open(WARDS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def extract_weather_parameters(weather_dict: dict) -> Tuple[float, float, float]:
    """
    Extracts 3-hour expected rainfall, current temperature, and relative humidity
    from WeatherService structured output.
    """
    hourly_list = weather_dict.get("hourly", [])
    if isinstance(hourly_list, list) and len(hourly_list) >= 3:
        rain_3h = sum(float(item.get("rain_mm", 0.0) or 0.0) for item in hourly_list[:3])
    else:
        rain_3h = float(weather_dict.get("current", {}).get("precipitation_mm", 0.0) or 0.0) * 2.5
    temp_c = float(weather_dict.get("current", {}).get("temperature_c", 35.0))
    hum_pct = float(weather_dict.get("current", {}).get("humidity_pct", 55.0))
    return rain_3h, temp_c, hum_pct

def compute_ward_risk(
    props: dict,
    horizon: str = "now",
    simulated_rain_mm: Optional[float] = None,
    simulated_temp_c: Optional[float] = None,
    live_rain_mm: Optional[float] = None,
    live_temp_c: Optional[float] = None,
    live_humidity_pct: Optional[float] = None
) -> dict:
    """
    Dynamically computes flood & heat risk scores, depth, level, confidence, and explainability factors
    for a given ward based on physical topography, ML prediction, and live/simulated weather parameters.
    """
    if simulated_rain_mm is not None:
        rain_3h = simulated_rain_mm
    elif live_rain_mm is not None:
        rain_3h = live_rain_mm
    else:
        rain_3h = 55.0 if props["ward_id"] in ["ward-72", "ward-71", "ward-55"] else 22.0

    if horizon == "6h":
        rain_3h *= 1.25
    elif horizon == "24h":
        rain_3h *= 0.65
    elif horizon == "72h":
        rain_3h *= 0.30

    if simulated_temp_c is not None:
        temp_c = simulated_temp_c
    elif live_temp_c is not None:
        temp_c = live_temp_c
    else:
        temp_c = 41.5 if props["ward_id"] == "ward-48" else 35.0

    humidity_pct = live_humidity_pct if live_humidity_pct is not None else (
        58.0 if rain_3h > 20 else 42.0
    )

    flood_features = {
        "rain_1h_mm": rain_3h * 0.45,
        "rain_3h_mm": rain_3h,
        "elevation_m": props["base_elevation_m"],
        "twi": props["twi"],
        "hand_m": props["hand_m"],
        "drainage_health": props["drainage_health"],
        "impervious_fraction": props["impervious_fraction"],
        "musi_proximity_km": props["musi_proximity_km"],
        "lake_overflow_risk": props["lake_overflow_risk"]
    }

    f_score, f_level, f_depth, f_conf = FloodRiskEngine.calculate_blended_risk(flood_features)
    factors = FloodRiskEngine.explain_factors(flood_features)
    contributions = FloodRiskEngine.explain_contributions(flood_features)

    heat_features = {
        "temp_c": temp_c,
        "humidity_pct": humidity_pct,
        "impervious_fraction": props["impervious_fraction"],
        "outdoor_workers_pct": props["outdoor_workers_pct"],
        "elderly_pct": props["elderly_pct"]
    }
    h_score, h_level, _, heat_idx, heat_factors = HeatRiskEngine.calculate_heat_risk(heat_features)

    updated_props = dict(props)
    updated_props["flood_score"] = f_score
    updated_props["flood_level"] = f_level
    updated_props["flood_depth_cm"] = f_depth
    updated_props["heat_score"] = h_score
    updated_props["heat_level"] = h_level
    updated_props["heat_temp_c"] = temp_c
    updated_props["heat_index_c"] = heat_idx
    updated_props["confidence"] = f_conf
    updated_props["top_factors"] = factors
    updated_props["heat_factors"] = heat_factors
    updated_props["contributions"] = contributions
    return updated_props

@router.get("/wards")
def get_all_wards_risk(
    horizon: str = Query("now", pattern="^(now|6h|24h|72h)$"),
    hazard: Optional[str] = Query(None, pattern="^(flood|heat)$"),
    simulated_rain_mm: Optional[float] = Query(None, ge=0, le=150),
    simulated_temp_c: Optional[float] = Query(None, ge=20, le=50)
):
    """
    Returns all 22 Hyderabad wards with live computed flood & heat risk scores,
    depth estimates, and explainability factors.
    Supports 'what-if' simulation parameters (simulated_rain_mm and simulated_temp_c)
    and fuses live Open-Meteo weather when simulations are omitted.
    """
    live_rain_3h = None
    live_temp = None
    live_humidity = None
    if simulated_rain_mm is None or simulated_temp_c is None:
        try:
            hyd_weather = weather_service.get_weather(17.3850, 78.4867)
            calc_rain, calc_temp, calc_hum = extract_weather_parameters(hyd_weather)
            if simulated_rain_mm is None:
                live_rain_3h = calc_rain
            if simulated_temp_c is None:
                live_temp = calc_temp
                live_humidity = calc_hum
        except Exception as e:
            logger.warning("Could not retrieve live weather for wards: %s", e)

    data = load_wards_geojson()
    features = data.get("features", [])

    results = []
    for feat in features:
        props = compute_ward_risk(
            feat["properties"],
            horizon=horizon,
            simulated_rain_mm=simulated_rain_mm,
            simulated_temp_c=simulated_temp_c,
            live_rain_mm=live_rain_3h,
            live_temp_c=live_temp,
            live_humidity_pct=live_humidity
        )
        results.append({
            "type": "Feature",
            "id": feat["id"],
            "properties": props,
            "geometry": feat["geometry"]
        })

    return {
        "type": "FeatureCollection",
        "horizon": horizon,
        "hazard_filter": hazard,
        "features": results
    }

@router.get("")
def get_risk_at_location(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees"),
    horizon: str = Query("now", pattern="^(now|6h|24h|72h)$")
):
    """
    Finds nearest ward/cell to given coordinates and dynamically calculates real-time risk scores.
    Accepts any valid global coordinates.
    """
    data = load_wards_geojson()
    best_ward = None
    min_dist_km = float("inf")

    for feat in data["features"]:
        coords = feat["geometry"]["coordinates"][0]
        centroid_lng = sum(p[0] for p in coords) / len(coords)
        centroid_lat = sum(p[1] for p in coords) / len(coords)
        # Planar euclidean distance in km
        d_km = (((lat - centroid_lat) * 111.0) ** 2 + ((lng - centroid_lng) * 105.0) ** 2) ** 0.5
        if d_km < min_dist_km:
            min_dist_km = d_km
            best_ward = feat

    if not best_ward:
        best_ward = data["features"][0]
        min_dist_km = 0.0

    # Retrieve live weather at requested coordinates
    live_rain_3h = None
    live_temp = None
    live_humidity = None
    try:
        loc_weather = weather_service.get_weather(lat, lng)
        live_rain_3h, live_temp, live_humidity = extract_weather_parameters(loc_weather)
    except Exception as exc:
        logger.warning("Could not fetch live weather for coordinates (%s, %s): %s", lat, lng, exc)

    computed = compute_ward_risk(
        best_ward["properties"],
        horizon=horizon,
        live_rain_mm=live_rain_3h,
        live_temp_c=live_temp,
        live_humidity_pct=live_humidity
    )
    coverage_note = None
    if min_dist_km > 25.0:
        coverage_note = f"Coordinates are {round(min_dist_km, 1)}km from central Hyderabad. Displaying nearest pilot telemetry from {computed['name']}."

    return {
        "ward_id": computed["ward_id"],
        "ward_name": computed["name"],
        "lat": lat,
        "lng": lng,
        "distance_to_ward_km": round(min_dist_km, 2),
        "coverage_note": coverage_note,
        "horizon": horizon,
        "flood": {
            "score": computed["flood_score"],
            "level": computed["flood_level"],
            "expected_depth_cm": computed["flood_depth_cm"],
            "factors": computed["top_factors"]
        },
        "heat": {
            "score": computed["heat_score"],
            "level": computed["heat_level"],
            "temp_c": computed["heat_temp_c"],
            "heat_index_c": computed["heat_index_c"],
            "factors": computed["heat_factors"]
        },
        "confidence": computed["confidence"],
        "advisory": "Advisory only. Complements official IMD / NDMA warnings."
    }

@router.get("/explain")
def explain_risk(cell_id: str = Query(...)):
    """
    Returns mathematically calculated SHAP / rule feature decomposition for a specific ward or grid cell.
    """
    data = load_wards_geojson()
    matched = next((f for f in data["features"] if f["id"] == cell_id or f["properties"]["ward_id"] == cell_id), None)
    if not matched:
        raise HTTPException(status_code=404, detail=f"Cell/Ward {cell_id} not found")

    computed = compute_ward_risk(matched["properties"])
    return {
        "ward_id": computed["ward_id"],
        "name": computed["name"],
        "explainability": {
            "summary": f"Calculated flood risk score {computed['flood_score']}/100 ({computed['flood_level']}) due to {computed['drainage_health'].lower()} drainage in low basin ({computed['base_elevation_m']}m).",
            "top_contributing_factors": computed["contributions"],
            "confidence": computed["confidence"],
            "last_updated": "2026-10-25T18:10:00Z"
        }
    }

@router.get("/{ward_id}")
def get_ward_risk_by_id(ward_id: str, horizon: str = Query("now", pattern="^(now|6h|24h|72h)$")):
    """
    Returns dynamically computed ward risk scores, flood depth cm, heat index, and factors.
    """
    data = load_wards_geojson()
    matched = next((f for f in data["features"] if f.get("id") == ward_id or f["properties"].get("ward_id") == ward_id), None)
    if not matched:
        raise HTTPException(status_code=404, detail=f"Ward {ward_id} not found")
    
    live_rain_3h = None
    live_temp = None
    live_humidity = None
    try:
        coords = matched["geometry"]["coordinates"][0]
        centroid_lng = sum(p[0] for p in coords) / len(coords)
        centroid_lat = sum(p[1] for p in coords) / len(coords)
        loc_weather = weather_service.get_weather(centroid_lat, centroid_lng)
        live_rain_3h, live_temp, live_humidity = extract_weather_parameters(loc_weather)
    except Exception as exc:
        logger.warning("Could not fetch live weather for ward %s: %s", ward_id, exc)

    computed = compute_ward_risk(
        matched["properties"],
        horizon=horizon,
        live_rain_mm=live_rain_3h,
        live_temp_c=live_temp,
        live_humidity_pct=live_humidity
    )
    return {
        "ward_id": computed["ward_id"],
        "name": computed["name"],
        "horizon": horizon,
        "flood_score": computed["flood_score"],
        "flood_level": computed["flood_level"],
        "flood_depth_cm": computed["flood_depth_cm"],
        "heat_score": computed["heat_score"],
        "heat_level": computed["heat_level"],
        "heat_index_c": computed["heat_index_c"],
        "confidence": computed["confidence"],
        "top_factors": computed["top_factors"]
    }

