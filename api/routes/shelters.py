import json
import os
import uuid
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/shelters", tags=["Shelters & Cooling Centers"])

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
SHELTERS_FILE = os.path.join(DATA_DIR, "shelters.json")

def load_shelters() -> List[dict]:
    with open(SHELTERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

# In-memory store initialized from data file
SHELTERS_STORE = load_shelters()

class ShelterSubmission(BaseModel):
    name: str = "New Community Point"
    ward_id: str
    ward_name: str
    type: str = "Community Hall"
    address: str
    lat: float
    lng: float
    contact: str
    incharge_name: str
    capacity: int = 150
    facilities: dict = {
        "drinking_water": True,
        "toilets": True,
        "power_backup": False,
        "medical_aid": False,
        "wheelchair_accessible": False,
        "women_safe_area": True,
        "pet_friendly": False
    }

class VerifyShelterRequest(BaseModel):
    verifier_name: str
    verifier_role: str  # "Municipal Officer" | "Ward Volunteer"
    gps_check_passed: bool = True
    call_confirmed: bool = True
    capacity_verified: int
    notes: Optional[str] = "Inspected water and sanitary facilities."

@router.get("")
def list_shelters(
    lat: Optional[float] = Query(None, ge=17.0, le=18.0),
    lng: Optional[float] = Query(None, ge=78.0, le=79.0),
    verified_only: bool = Query(False),
    facility: Optional[str] = Query(None),
    ward_id: Optional[str] = Query(None)
):
    results = []
    user_lat = lat or 17.3824
    user_lng = lng or 78.4230

    for s in SHELTERS_STORE:
        if verified_only and "Verified" not in s["verification_status"]:
            continue
        if ward_id and s["ward_id"] != ward_id:
            continue
        if facility and not s["facilities"].get(facility, False):
            continue

        item = dict(s)
        # Approximate euclidean distance in km (1 deg lat ~ 111km, 1 deg lng ~ 105km)
        d_km = (((item["lat"] - user_lat) * 111.0) ** 2 + ((item["lng"] - user_lng) * 105.0) ** 2) ** 0.5
        item["distance_km"] = round(d_km, 2)
        # Walking time: roughly 12 mins per km
        item["walking_mins"] = max(2, int(d_km * 12))
        results.append(item)

    results.sort(key=lambda x: x["distance_km"])
    return results

@router.post("")
def submit_shelter(payload: ShelterSubmission):
    new_id = f"shelter-{uuid.uuid4().hex[:6]}"
    obj = {
        "id": new_id,
        "name": payload.name,
        "ward_id": payload.ward_id,
        "ward_name": payload.ward_name,
        "type": payload.type,
        "address": payload.address,
        "lat": payload.lat,
        "lng": payload.lng,
        "contact": payload.contact,
        "incharge_name": payload.incharge_name,
        "capacity": payload.capacity,
        "current_occupancy": 0,
        "facilities": payload.facilities,
        "operating_hours": "08:00 - 20:00",
        "flood_safe_elevation": True,
        "elevation_m": 500.0,
        "verification_status": "Community-submitted unverified",
        "verified_at": None,
        "verifier": None
    }
    SHELTERS_STORE.append(obj)
    return obj

@router.post("/{shelter_id}/verify")
def verify_shelter(shelter_id: str, payload: VerifyShelterRequest):
    shelter = next((s for s in SHELTERS_STORE if s["id"] == shelter_id), None)
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter not found")

    status = "Verified by municipality" if "Municipal" in payload.verifier_role else "Verified by volunteer"
    shelter["verification_status"] = status
    shelter["verified_at"] = "2026-10-25T18:15:00Z"
    shelter["verifier"] = f"{payload.verifier_name} ({payload.verifier_role})"
    shelter["capacity"] = payload.capacity_verified
    shelter["verification_notes"] = payload.notes

    return shelter
