"""
Nirvana: Hyperlocal Climate Risk & Resilience Platform
Backend API Engine (FastAPI + OpenAPI v1)
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
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

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial telemetry payload
        await websocket.send_text(json.dumps({
            "type": "INITIAL_TELEMETRY",
            "city": "Hyderabad",
            "active_wards_monitored": 22,
            "status": "MONSOON_PROTOCOL_ACTIVE"
        }))
        while True:
            data = await websocket.receive_text()
            # Echo or broadcast client actions (e.g. simulation pulses)
            await manager.broadcast({
                "type": "TELEMETRY_PULSE",
                "client_msg": data
            })
    except WebSocketDisconnect:
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
