import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from api.main import app

def test_weather_integration():
    client = TestClient(app)

    # 1. Location 1: Hyderabad, India (17.3850, 78.4867)
    res_hyd = client.get("/api/v1/forecast?lat=17.3850&lng=78.4867")
    assert res_hyd.status_code == 200, f"Expected 200, got {res_hyd.status_code}"
    data_hyd = res_hyd.json()

    assert "location" in data_hyd
    assert data_hyd["location"]["lat"] == 17.3850
    assert data_hyd["location"]["lng"] == 78.4867
    assert data_hyd["location"]["timezone"] == "Asia/Kolkata"

    assert "current" in data_hyd
    curr_hyd = data_hyd["current"]
    assert "temperature_c" in curr_hyd and isinstance(curr_hyd["temperature_c"], (int, float))
    assert "apparent_temperature_c" in curr_hyd and isinstance(curr_hyd["apparent_temperature_c"], (int, float))
    assert "humidity_pct" in curr_hyd and 0 <= curr_hyd["humidity_pct"] <= 100
    assert "wind_speed_kmh" in curr_hyd and curr_hyd["wind_speed_kmh"] >= 0
    assert "precipitation_mm" in curr_hyd and curr_hyd["precipitation_mm"] >= 0
    assert "weather_description" in curr_hyd and len(curr_hyd["weather_description"]) > 0
    assert "time" in curr_hyd

    assert "hourly" in data_hyd and len(data_hyd["hourly"]) == 24
    assert "daily" in data_hyd and len(data_hyd["daily"]) >= 7
    print(f"PASS Location 1 (Hyderabad): {curr_hyd['temperature_c']}C, {curr_hyd['weather_description']}, Humidity: {curr_hyd['humidity_pct']}%, Wind: {curr_hyd['wind_speed_kmh']} km/h, TZ: {data_hyd['location']['timezone']}")

    # 2. Location 2: London, UK (51.5074, -0.1278)
    res_ldn = client.get("/api/v1/forecast?lat=51.5074&lng=-0.1278")
    assert res_ldn.status_code == 200
    data_ldn = res_ldn.json()

    assert data_ldn["location"]["lat"] == 51.5074
    assert data_ldn["location"]["lng"] == -0.1278
    assert data_ldn["location"]["timezone"] == "Europe/London"
    # Ensure timezones and coordinates are distinctly resolved
    assert data_hyd["location"]["timezone"] != data_ldn["location"]["timezone"]
    assert data_hyd["location"]["lat"] != data_ldn["location"]["lat"]
    curr_ldn = data_ldn["current"]
    print(f"PASS Location 2 (London): {curr_ldn['temperature_c']}C, {curr_ldn['weather_description']}, Humidity: {curr_ldn['humidity_pct']}%, Wind: {curr_ldn['wind_speed_kmh']} km/h, TZ: {data_ldn['location']['timezone']}")

    # 3. Cache verification: immediate second request should return cached: True
    res_cached = client.get("/api/v1/forecast?lat=17.3850&lng=78.4867")
    assert res_cached.status_code == 200
    data_cached = res_cached.json()
    assert data_cached["metadata"]["cached"] is True
    print("PASS Cache verification: immediate repeat query served from cache with timestamped metadata")

    # 4. Force refresh verification: refresh=True bypasses cache
    res_refreshed = client.get("/api/v1/forecast?lat=17.3850&lng=78.4867&refresh=true")
    assert res_refreshed.status_code == 200
    data_refreshed = res_refreshed.json()
    assert data_refreshed["metadata"]["cached"] is False
    print("PASS Refresh verification: refresh=true successfully bypasses cache and queries upstream")

    # 5. Geocoding search endpoint verification
    res_search = client.get("/api/v1/forecast/search?q=Secunderabad")
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert search_data["count"] > 0
    match = search_data["results"][0]
    assert "lat" in match and "lng" in match and "name" in match
    print(f"PASS Geocoding search: query 'Secunderabad' resolved to {match['name']}, {match['lat']}, {match['lng']} ({match.get('admin1', '')}, {match.get('country', '')})")

    # 6. Coordinate validation verification: Out of bounds latitude / longitude
    res_invalid_lat = client.get("/api/v1/forecast?lat=105.0&lng=78.4867")
    assert res_invalid_lat.status_code == 422, "Latitude > 90 must return 422"

    res_invalid_lng = client.get("/api/v1/forecast?lat=17.3850&lng=195.0")
    assert res_invalid_lng.status_code == 422, "Longitude > 180 must return 422"
    print("PASS Boundary validation: Out of range coordinates return 422 Unprocessable Entity")

    print("\nALL WEATHER INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_weather_integration()
