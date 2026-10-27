"""
Nirvana: Hyperlocal Climate Risk & Resilience Platform
Backend API Engine (FastAPI + OpenAPI v1)
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import datetime
import json
import os
import sys

# Add root directory to python path for module imports
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from api.routes import system, risk, forecast, alerts, shelters, reports, guidance, auth, auth_subs, dashboard, simulation

app = FastAPI(
    title="Nirvana Civic Climate Resilience API",
    description="Hyperlocal Climate Risk Alerts, Hydrological Intelligence & Disaster Response Planning for Vulnerable Urban Communities.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure secure, environment-aware CORS
raw_cors = os.environ.get("CORS_ORIGINS", "")
if raw_cors.strip():
    allowed_origins = [o.strip() for o in raw_cors.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

# When wildcard '*' is present, allow_credentials must be False to comply with CORS specs
allow_credentials = "*" not in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register versioned routers under /api/v1
app.include_router(auth.router, prefix="/api/v1")
app.include_router(system.router, prefix="/api/v1")
app.include_router(risk.router, prefix="/api/v1")
app.include_router(forecast.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(shelters.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(guidance.router, prefix="/api/v1")
app.include_router(auth_subs.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(simulation.router, prefix="/api/v1")

# Also provide root aliases for standard container / balancer health checks
@app.get("/health", tags=["System"])
def root_health():
    return system.health_check()

@app.get("/data-sources/status", tags=["System"])
def root_data_sources():
    return system.data_sources_status()

# WebSocket connection manager for live telemetry
class TelemetryConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

manager = TelemetryConnectionManager()

@app.websocket("/api/v1/ws/live")
@app.websocket("/ws/live")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial telemetry payload with Doppler & culvert mesh status
        await websocket.send_text(json.dumps({
            "type": "INITIAL_TELEMETRY",
            "city": "Hyderabad",
            "active_wards_monitored": 22,
            "status": "MONSOON_PROTOCOL_ACTIVE",
            "telemetry_nodes_online": 42,
            "doppler_reflectivity_dbz": 38.5,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }))
        while True:
            try:
                # Wait for client input with 20s heartbeat window
                data = await asyncio.wait_for(websocket.receive_text(), timeout=20.0)
                await manager.broadcast({
                    "type": "TELEMETRY_PULSE",
                    "client_msg": data,
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
                })
            except asyncio.TimeoutError:
                # Emit periodic telemetry update to keep connection active and sensors synchronized
                await websocket.send_text(json.dumps({
                    "type": "TELEMETRY_HEARTBEAT",
                    "source": "GHMC_CULVERT_MESH",
                    "active_sensors": 42,
                    "musi_flow_rate_cumecs": 450.2,
                    "rainfall_rate_mm_hr": 24.5,
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
                }))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.get("/")
def root():
    return {
        "project": "Nirvana",
        "tagline": "Hyperlocal Climate Risk Alerts for Vulnerable Urban Communities",
        "docs": "/docs",
        "health": "/api/v1/health",
        "status": "ready"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
