"""
Nirvana Civic Climate Resilience Platform
Weather Service Module (Open-Meteo Provider Integration)

Integrates Open-Meteo live API (https://open-meteo.com/) for accurate,
location-aware current conditions, hourly forecasts, and daily weather.
Includes intelligent in-memory TTL caching, WMO weather interpretation,
wind direction calculation, and geocoding.
"""

import time
import datetime
import logging
from typing import Dict, Any, Optional, List
import requests

logger = logging.getLogger(__name__)

# WMO Weather Interpretation Codes (WMO Code Table 4677)
WMO_CODE_MAP: Dict[int, Dict[str, str]] = {
    0: {"desc": "Clear sky", "category": "clear", "icon": "sun"},
    1: {"desc": "Mainly clear", "category": "clear", "icon": "sun"},
    2: {"desc": "Partly cloudy", "category": "cloudy", "icon": "cloud-sun"},
    3: {"desc": "Overcast", "category": "cloudy", "icon": "cloud"},
    45: {"desc": "Fog", "category": "fog", "icon": "cloud-fog"},
    48: {"desc": "Depositing rime fog", "category": "fog", "icon": "cloud-fog"},
    51: {"desc": "Light drizzle", "category": "drizzle", "icon": "cloud-drizzle"},
    53: {"desc": "Moderate drizzle", "category": "drizzle", "icon": "cloud-drizzle"},
    55: {"desc": "Dense intensity drizzle", "category": "drizzle", "icon": "cloud-drizzle"},
    56: {"desc": "Light freezing drizzle", "category": "drizzle", "icon": "cloud-snow"},
    57: {"desc": "Dense freezing drizzle", "category": "drizzle", "icon": "cloud-snow"},
    61: {"desc": "Slight rain", "category": "rain", "icon": "cloud-rain"},
    63: {"desc": "Moderate rain", "category": "rain", "icon": "cloud-rain"},
    65: {"desc": "Heavy rain deluge", "category": "rain", "icon": "cloud-rain"},
    66: {"desc": "Light freezing rain", "category": "rain", "icon": "cloud-snow"},
    67: {"desc": "Heavy freezing rain", "category": "rain", "icon": "cloud-snow"},
    71: {"desc": "Slight snow fall", "category": "snow", "icon": "cloud-snow"},
    73: {"desc": "Moderate snow fall", "category": "snow", "icon": "cloud-snow"},
    75: {"desc": "Heavy snow fall", "category": "snow", "icon": "cloud-snow"},
    77: {"desc": "Snow grains", "category": "snow", "icon": "cloud-snow"},
    80: {"desc": "Slight rain showers", "category": "rain", "icon": "cloud-rain"},
    81: {"desc": "Moderate rain showers", "category": "rain", "icon": "cloud-rain"},
    82: {"desc": "Violent rain showers", "category": "rain", "icon": "cloud-rain"},
    85: {"desc": "Slight snow showers", "category": "snow", "icon": "cloud-snow"},
    86: {"desc": "Heavy snow showers", "category": "snow", "icon": "cloud-snow"},
    95: {"desc": "Thunderstorm", "category": "thunderstorm", "icon": "cloud-lightning"},
    96: {"desc": "Thunderstorm with slight hail", "category": "thunderstorm", "icon": "cloud-lightning"},
    99: {"desc": "Thunderstorm with heavy hail", "category": "thunderstorm", "icon": "cloud-lightning"},
}

CARDINAL_DIRECTIONS = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
]

def degrees_to_cardinal(deg: Optional[float]) -> str:
    if deg is None:
        return "N/A"
    idx = int((deg + 11.25) / 22.5) % 16
    return CARDINAL_DIRECTIONS[idx]

def get_wmo_info(code: Optional[int]) -> Dict[str, str]:
    if code is None:
        return {"desc": "Unknown", "category": "unknown", "icon": "help-circle"}
    return WMO_CODE_MAP.get(code, {"desc": f"Weather code {code}", "category": "unknown", "icon": "cloud"})

class WeatherCacheEntry:
    def __init__(self, data: Dict[str, Any], ttl_seconds: int = 600):
        self.data = data
        self.cached_at = time.time()
        self.expires_at = self.cached_at + ttl_seconds

    def is_expired(self) -> bool:
        return time.time() > self.expires_at

class WeatherService:
    """
    Dedicated weather service using Open-Meteo's official public API.
    Provides current observations, hourly forecasts, daily summaries,
    in-memory TTL caching, and geocoding.
    """
    FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast"
    GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search"
    DEFAULT_TTL_SECONDS = 600  # 10 minutes cache expiry

    def __init__(self):
        self._cache: Dict[str, WeatherCacheEntry] = {}

    def _cache_key(self, lat: float, lng: float) -> str:
        # Precision to 3 decimal places (~110 meters)
        return f"{round(lat, 3):.3f}_{round(lng, 3):.3f}"

    def get_weather(
        self,
        lat: float,
        lng: float,
        forecast_days: int = 7,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Retrieves live weather data for the specified latitude and longitude.
        Validates coordinate ordering and values, checks cache, and handles API errors.
        """
        # Validate coordinates
        if not (-90.0 <= lat <= 90.0):
            raise ValueError(f"Invalid latitude: {lat}. Must be between -90 and 90.")
        if not (-180.0 <= lng <= 180.0):
            raise ValueError(f"Invalid longitude: {lng}. Must be between -180 and 180.")

        key = self._cache_key(lat, lng)
        cached_entry = self._cache.get(key)

        if not force_refresh and cached_entry and not cached_entry.is_expired():
            res = dict(cached_entry.data)
            res["metadata"]["cached"] = True
            res["metadata"]["cache_expires_in_seconds"] = max(0, int(cached_entry.expires_at - time.time()))
            res["metadata"]["is_stale"] = False
            return res

        # Build official Open-Meteo parameters
        params = {
            "latitude": lat,
            "longitude": lng,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "is_day",
                "precipitation",
                "rain",
                "showers",
                "weather_code",
                "wind_speed_10m",
                "wind_direction_10m",
                "surface_pressure"
            ],
            "hourly": [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "precipitation_probability",
                "precipitation",
                "rain",
                "weather_code",
                "wind_speed_10m"
            ],
            "daily": [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "apparent_temperature_max",
                "apparent_temperature_min",
                "precipitation_sum",
                "precipitation_probability_max",
                "wind_speed_10m_max",
                "sunrise",
                "sunset",
                "uv_index_max"
            ],
            "timezone": "auto",
            "forecast_days": min(14, max(1, forecast_days))
        }

        try:
            resp = requests.get(
                self.FORECAST_ENDPOINT,
                params={k: ",".join(v) if isinstance(v, list) else v for k, v in params.items()},
                timeout=7.0
            )

            if resp.status_code == 200:
                raw = resp.json()
                transformed = self._transform_response(lat, lng, raw)
                self._cache[key] = WeatherCacheEntry(transformed, ttl_seconds=self.DEFAULT_TTL_SECONDS)
                return transformed
            else:
                logger.warning(f"Open-Meteo API returned HTTP {resp.status_code}: {resp.text}")
                # Fall back to cached entry if available
                if cached_entry:
                    res = dict(cached_entry.data)
                    res["metadata"]["cached"] = True
                    res["metadata"]["is_stale"] = True
                    res["metadata"]["warning"] = f"Provider returned HTTP {resp.status_code}. Displaying cached data."
                    return res
                raise RuntimeError(f"Open-Meteo API failed with status {resp.status_code}")

        except requests.exceptions.RequestException as exc:
            logger.error(f"Weather request error for ({lat}, {lng}): {exc}")
            if cached_entry:
                res = dict(cached_entry.data)
                res["metadata"]["cached"] = True
                res["metadata"]["is_stale"] = True
                res["metadata"]["warning"] = f"Network error contacting weather service. Displaying cached data."
                return res
            raise RuntimeError(f"Unable to reach weather service: {str(exc)}")

    def _transform_response(self, lat: float, lng: float, raw: Dict[str, Any]) -> Dict[str, Any]:
        """
        Standardizes Open-Meteo response into a structured, type-safe representation.
        """
        current_raw = raw.get("current", {})
        hourly_raw = raw.get("hourly", {})
        daily_raw = raw.get("daily", {})
        timezone = raw.get("timezone", "UTC")
        timezone_abbrev = raw.get("timezone_abbreviation", "")
        elevation = raw.get("elevation", 0)

        # Current weather extraction
        wmo_code = current_raw.get("weather_code")
        wmo_info = get_wmo_info(wmo_code)
        wind_deg = current_raw.get("wind_direction_10m")

        current = {
            "time": current_raw.get("time"),
            "temperature_c": current_raw.get("temperature_2m"),
            "apparent_temperature_c": current_raw.get("apparent_temperature"),
            "humidity_pct": current_raw.get("relative_humidity_2m"),
            "precipitation_mm": current_raw.get("precipitation", 0.0),
            "rain_mm": current_raw.get("rain", 0.0),
            "showers_mm": current_raw.get("showers", 0.0),
            "weather_code": wmo_code,
            "weather_description": wmo_info["desc"],
            "weather_category": wmo_info["category"],
            "weather_icon": wmo_info["icon"],
            "is_day": bool(current_raw.get("is_day", 1)),
            "wind_speed_kmh": current_raw.get("wind_speed_10m"),
            "wind_direction_deg": wind_deg,
            "wind_direction_cardinal": degrees_to_cardinal(wind_deg),
            "surface_pressure_hpa": current_raw.get("surface_pressure")
        }

        # Hourly forecast extraction (Next 24 hours)
        hourly_times = hourly_raw.get("time", [])[:24]
        hourly_temps = hourly_raw.get("temperature_2m", [])[:24]
        hourly_apparent = hourly_raw.get("apparent_temperature", [])[:24]
        hourly_humidity = hourly_raw.get("relative_humidity_2m", [])[:24]
        hourly_precip_prob = hourly_raw.get("precipitation_probability", [])[:24]
        hourly_rain = hourly_raw.get("rain", [])[:24]
        hourly_codes = hourly_raw.get("weather_code", [])[:24]
        hourly_wind = hourly_raw.get("wind_speed_10m", [])[:24]

        hourly: List[Dict[str, Any]] = []
        for i in range(len(hourly_times)):
            c = hourly_codes[i] if i < len(hourly_codes) else None
            wi = get_wmo_info(c)
            hourly.append({
                "time": hourly_times[i],
                "temperature_c": hourly_temps[i] if i < len(hourly_temps) else None,
                "apparent_temperature_c": hourly_apparent[i] if i < len(hourly_apparent) else None,
                "humidity_pct": hourly_humidity[i] if i < len(hourly_humidity) else None,
                "precipitation_probability_pct": hourly_precip_prob[i] if i < len(hourly_precip_prob) else 0,
                "rain_mm": hourly_rain[i] if i < len(hourly_rain) else 0.0,
                "weather_code": c,
                "weather_description": wi["desc"],
                "weather_icon": wi["icon"],
                "wind_speed_kmh": hourly_wind[i] if i < len(hourly_wind) else None
            })

        # Daily forecast extraction
        daily_times = daily_raw.get("time", [])
        daily_codes = daily_raw.get("weather_code", [])
        daily_temp_max = daily_raw.get("temperature_2m_max", [])
        daily_temp_min = daily_raw.get("temperature_2m_min", [])
        daily_apparent_max = daily_raw.get("apparent_temperature_max", [])
        daily_apparent_min = daily_raw.get("apparent_temperature_min", [])
        daily_precip_sum = daily_raw.get("precipitation_sum", [])
        daily_precip_prob_max = daily_raw.get("precipitation_probability_max", [])
        daily_wind_max = daily_raw.get("wind_speed_10m_max", [])
        daily_sunrise = daily_raw.get("sunrise", [])
        daily_sunset = daily_raw.get("sunset", [])
        daily_uv_max = daily_raw.get("uv_index_max", [])

        daily: List[Dict[str, Any]] = []
        for i in range(len(daily_times)):
            c = daily_codes[i] if i < len(daily_codes) else None
            wi = get_wmo_info(c)
            daily.append({
                "date": daily_times[i],
                "weather_code": c,
                "weather_description": wi["desc"],
                "weather_icon": wi["icon"],
                "temp_max_c": daily_temp_max[i] if i < len(daily_temp_max) else None,
                "temp_min_c": daily_temp_min[i] if i < len(daily_temp_min) else None,
                "apparent_temp_max_c": daily_apparent_max[i] if i < len(daily_apparent_max) else None,
                "apparent_temp_min_c": daily_apparent_min[i] if i < len(daily_apparent_min) else None,
                "precipitation_sum_mm": daily_precip_sum[i] if i < len(daily_precip_sum) else 0.0,
                "precipitation_probability_max_pct": daily_precip_prob_max[i] if i < len(daily_precip_prob_max) else 0,
                "wind_speed_max_kmh": daily_wind_max[i] if i < len(daily_wind_max) else None,
                "sunrise": daily_sunrise[i] if i < len(daily_sunrise) else None,
                "sunset": daily_sunset[i] if i < len(daily_sunset) else None,
                "uv_index_max": daily_uv_max[i] if i < len(daily_uv_max) else None
            })

        return {
            "location": {
                "lat": lat,
                "lng": lng,
                "timezone": timezone,
                "timezone_abbreviation": timezone_abbrev,
                "elevation_m": elevation
            },
            "current": current,
            "hourly": hourly,
            "daily": daily,
            "metadata": {
                "provider": "Open-Meteo High-Resolution NWP",
                "model_attribution": "ECMWF / DWD ICON Seamless Numerical Weather Prediction",
                "fetched_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "cached": False,
                "cache_expires_in_seconds": self.DEFAULT_TTL_SECONDS,
                "is_stale": False
            }
        }

    def search_cities(self, query: str, count: int = 5) -> List[Dict[str, Any]]:
        """
        Geocodes a search string using the official Open-Meteo Geocoding API.
        Returns matching locations with lat, lng, country, and admin division.
        """
        if not query or len(query.strip()) < 2:
            return []

        try:
            resp = requests.get(
                self.GEOCODING_ENDPOINT,
                params={
                    "name": query.strip(),
                    "count": count,
                    "language": "en",
                    "format": "json"
                },
                timeout=5.0
            )
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                out = []
                for item in results:
                    out.append({
                        "id": item.get("id"),
                        "name": item.get("name"),
                        "lat": item.get("latitude"),
                        "lng": item.get("longitude"),
                        "country": item.get("country"),
                        "country_code": item.get("country_code"),
                        "admin1": item.get("admin1"),
                        "timezone": item.get("timezone"),
                        "elevation_m": item.get("elevation")
                    })
                return out
        except Exception as exc:
            logger.warning(f"Geocoding search failed for '{query}': {exc}")
        return []

# Singleton instance for application-wide reuse and unified caching
weather_service = WeatherService()
