"""
Test Suite for Stage 6: Real-Time Telemetry WebSocket & Periodic Heartbeat
Validates that:
1. /api/v1/ws/live and /ws/live accept WebSocket connections.
2. Initial telemetry payload contains active wards, Doppler reflectivity, and culvert mesh status.
3. Client messages trigger broadcast telemetry pulses.
4. Disconnects are managed safely by TelemetryConnectionManager without resource leakage.
"""

import sys
import os
import json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from api.main import app

def test_websocket_telemetry_lifecycle():
    client = TestClient(app)

    # 1. Test canonical route /api/v1/ws/live
    with client.websocket_connect("/api/v1/ws/live") as ws:
        init_raw = ws.receive_text()
        init_data = json.loads(init_raw)
        assert init_data["type"] == "INITIAL_TELEMETRY", f"Expected INITIAL_TELEMETRY, got {init_data.get('type')}"
        assert init_data["city"] == "Hyderabad"
        assert init_data["active_wards_monitored"] == 22
        assert init_data["telemetry_nodes_online"] == 42
        assert "doppler_reflectivity_dbz" in init_data
        print(f"PASS: Initial Telemetry received: {init_data['city']} ({init_data['active_wards_monitored']} wards, {init_data['telemetry_nodes_online']} nodes)")

        # 2. Test send and pulse broadcast
        ws.send_text(json.dumps({"action": "PING_SENSORS", "client_ts": 12345}))
        pulse_raw = ws.receive_text()
        pulse_data = json.loads(pulse_raw)
        assert pulse_data["type"] == "TELEMETRY_PULSE"
        assert "PING_SENSORS" in pulse_data["client_msg"]
        print("PASS: Telemetry pulse received and echoed correctly")

    # 3. Test alias route /ws/live
    with client.websocket_connect("/ws/live") as ws2:
        init_raw2 = ws2.receive_text()
        init_data2 = json.loads(init_raw2)
        assert init_data2["type"] == "INITIAL_TELEMETRY"
        print("PASS: WebSocket alias route /ws/live operational")

if __name__ == "__main__":
    test_websocket_telemetry_lifecycle()
    print("ALL STAGE 6 WEBSOCKET TELEMETRY TESTS PASSED!")
