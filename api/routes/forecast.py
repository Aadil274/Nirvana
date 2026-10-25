"""
Nirvana Civic Climate Resilience Platform
Weather & Forecast API Route

Provides live location-aware weather observations, hourly forecasts,
multi-day projections, and city geocoding via Open-Meteo.
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from api.services.weather_service import weather_service

router = APIRouter(prefix="/forecast", tags=["Weather Forecast"])

@router.get("")
def get_forecast(
    lat: float = Query(17.3850, ge=-90.0, le=90.0, description="Latitude in decimal degrees (-90 to 90)"),
    lng: float = Query(78.4867, ge=-180.0, le=180.0, description="Longitude in decimal degrees (-180 to 180)"),
    days: int = Query(7, ge=1, le=14, description="Number of forecast days (1 to 14)"),
    refresh: bool = Query(False, description="Bypass in-memory cache and fetch fresh observations")
):
    """
    Retrieves accurate, real-time meteorological conditions and forecasts for the specified coordinates.
    Data is sourced from Open-Meteo High-Resolution Numerical Weather Prediction (NWP) models.
    """
    try:
        data = weather_service.get_weather(
            lat=lat,
            lng=lng,
            forecast_days=days,
            force_refresh=refresh
        )

        # Maintain backward compatibility for existing callers expecting rainfall_rate_mm_hr
        if "rainfall_rate_mm_hr" not in data["current"]:
            data["current"]["rainfall_rate_mm_hr"] = data["current"].get("precipitation_mm", 0.0)

        # Also maintain top-level lat / lng keys for existing integration tests
        data["lat"] = lat
        data["lng"] = lng
        data["source"] = data["metadata"]["provider"]

        return data

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Weather service error: {str(exc)}"
        )

@router.get("/search")
def search_locations(
    q: str = Query(..., min_length=2, description="City, locality, or town name to search"),
    count: int = Query(5, ge=1, le=10, description="Maximum number of candidate matches")
):
    """
    Geocodes a search string using the official Open-Meteo Geocoding API.
    Resolves city name to precise latitude, longitude, country, and admin region.
    """
    results = weather_service.search_cities(query=q, count=count)
    return {
        "query": q,
        "count": len(results),
        "results": results
    }
