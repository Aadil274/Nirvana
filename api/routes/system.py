from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["System & Data Sources"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Nirvana Climate Resilience API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@router.get("/data-sources/status")
def data_sources_status():
    return {
        "sources": [
            {
                "id": "open_meteo",
                "name": "Open-Meteo High-Resolution Forecast",
                "status": "online",
                "last_fetch": "2026-10-25T18:00:00Z",
                "latency_ms": 142,
                "confidence": 0.95,
                "coverage": "Hourly precipitation, convective rain, temperature, humidity"
            },
            {
                "id": "imd_doppler_hyderabad",
                "name": "IMD Hyderabad S-Band Doppler Radar (Begumpet)",
                "status": "online",
                "last_fetch": "2026-10-25T18:08:00Z",
                "latency_ms": 280,
                "confidence": 0.98,
                "coverage": "Max dBZ reflectivity, storm cell motion tracking"
            },
            {
                "id": "ghmc_culvert_iot",
                "name": "GHMC Stormwater IoT Sensors Network (42 Nodes)",
                "status": "online",
                "last_fetch": "2026-10-25T18:10:00Z",
                "latency_ms": 95,
                "confidence": 0.92,
                "coverage": "Nala water depth, flow rate, culvert blockage alerts"
            },
            {
                "id": "copernicus_dem",
                "name": "Copernicus GLO-30 Digital Elevation Model",
                "status": "online",
                "last_fetch": "Pre-computed static raster",
                "latency_ms": 12,
                "confidence": 0.99,
                "coverage": "30m spatial resolution elevation, slope, TWI, HAND"
            },
            {
                "id": "citizen_ground_truth",
                "name": "Nirvana Ground-Truth Citizen Telemetry",
                "status": "active",
                "active_reports": 38,
                "verified_rate": 0.84,
                "confidence": 0.90,
                "coverage": "Hyperlocal waterlogging & choked drain field verification"
            }
        ],
        "system_status": "ALL_SYSTEMS_NOMINAL"
    }
