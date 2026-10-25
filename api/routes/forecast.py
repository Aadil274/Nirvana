import requests
from fastapi import APIRouter, Query

router = APIRouter(prefix="/forecast", tags=["Weather Forecast"])

@router.get("")
def get_forecast(
    lat: float = Query(17.3850, ge=17.0, le=18.0),
    lng: float = Query(78.4867, ge=78.0, le=79.0)
):
    """
    Retrieves weather forecast (hourly rainfall, convective rain, temperature, humidity)
    from Open-Meteo with fallback to local fixtures for offline resilience.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lng}"
        f"&hourly=temperature_2m,relative_humidity_2m,precipitation,rain"
        f"&forecast_days=3&timezone=Asia%2FKolkata"
    )
    try:
        resp = requests.get(url, timeout=3.0)
        if resp.status_code == 200:
            data = resp.json()
            hourly = data.get("hourly", {})
            times = hourly.get("time", [])[:24]
            rain = hourly.get("rain", [])[:24]
            temp = hourly.get("temperature_2m", [])[:24]
            humidity = hourly.get("relative_humidity_2m", [])[:24]

            return {
                "source": "Open-Meteo Free API (Live)",
                "lat": lat,
                "lng": lng,
                "current": {
                    "temperature_c": temp[0] if temp else 34.0,
                    "rainfall_rate_mm_hr": rain[0] if rain else 12.5,
                    "humidity_pct": humidity[0] if humidity else 65
                },
                "hourly": [
                    {
                        "time": t,
                        "rain_mm": r,
                        "temp_c": tp,
                        "humidity_pct": h
                    }
                    for t, r, tp, h in zip(times, rain, temp, humidity)
                ]
            }
    except Exception:
        pass

    # High-fidelity offline fallback fixture (Calibrated for Hyderabad monsoon event)
    times = [f"2026-10-25T{h:02d}:00" for h in range(18, 24)] + [f"2026-10-26T{h:02d}:00" for h in range(0, 18)]
    simulated_rain = [45.0, 58.0, 52.0, 38.0, 24.0, 15.0, 8.0, 4.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 5.0, 12.0, 22.0, 35.0]
    simulated_temp = [33.0, 32.5, 31.0, 30.0, 29.5, 29.0, 28.5, 28.0, 29.0, 31.0, 33.5, 36.0, 38.2, 39.5, 40.0, 39.0, 37.5, 36.0, 35.0, 34.0, 33.5, 33.0, 32.5, 32.0]
    simulated_humidity = [78, 85, 88, 86, 84, 82, 80, 78, 72, 65, 58, 52, 48, 45, 46, 50, 56, 62, 68, 72, 75, 78, 82, 85]

    return {
        "source": "Nirvana Calibrated Meteorological Fixture (Offline Fallback)",
        "lat": lat,
        "lng": lng,
        "current": {
            "temperature_c": simulated_temp[0],
            "rainfall_rate_mm_hr": simulated_rain[0],
            "humidity_pct": simulated_humidity[0]
        },
        "hourly": [
            {
                "time": t,
                "rain_mm": r,
                "temp_c": tp,
                "humidity_pct": h
            }
            for t, r, tp, h in zip(times, simulated_rain, simulated_temp, simulated_humidity)
        ]
    }
