import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/reports", tags=["Crowd-Sourced Citizen Ground Truth"])

class CitizenReportSubmission(BaseModel):
    ward_id: str
    ward_name: str
    category: str  # waterlogging, blocked_drain, heat_stress, power_cut
    severity: str = "Moderate"
    description: str
    location_name: str
    lat: float
    lng: float
    photo_url: Optional[str] = None
    has_audio_note: bool = False

REPORTS_STORE: List[dict] = [
    {
        "id": "rep-1",
        "ward_id": "ward-72",
        "ward_name": "Nadeem Colony",
        "category": "waterlogging",
        "severity": "Severe",
        "description": "Water reached knee level (35cm) near Quba Masjid street. Bilge pump failing.",
        "location_name": "Street 4, Near Quba Masjid",
        "lat": 17.3820,
        "lng": 78.4235,
        "photo_url": "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=500&auto=format&fit=crop&q=60",
        "has_audio_note": True,
        "timestamp": "12 mins ago",
        "confirm_votes": 14,
        "status": "verified",
        "verified_by": "Ward Champion Farooq"
    },
    {
        "id": "rep-2",
        "ward_id": "ward-72",
        "ward_name": "Nadeem Colony",
        "category": "blocked_drain",
        "severity": "High",
        "description": "Shah Hatim culvert inlet choked with coconut shells and tree branches. Overflowing onto road.",
        "location_name": "Culvert Bridge, Military Road junction",
        "lat": 17.3845,
        "lng": 78.4210,
        "has_audio_note": False,
        "timestamp": "28 mins ago",
        "confirm_votes": 9,
        "status": "verified",
        "verified_by": "GHMC Engineering Squad 4"
    },
    {
        "id": "rep-3",
        "ward_id": "ward-55",
        "ward_name": "Moosarambagh",
        "category": "waterlogging",
        "severity": "Severe",
        "description": "Musi river backwater pushing up through storm drains at Ganga Nagar.",
        "location_name": "Ganga Nagar Colony, Lane 2",
        "lat": 17.3730,
        "lng": 78.5095,
        "has_audio_note": True,
        "timestamp": "42 mins ago",
        "confirm_votes": 21,
        "status": "verified",
        "verified_by": "SDRF Team Bravo"
    },
    {
        "id": "rep-4",
        "ward_id": "ward-48",
        "ward_name": "Charminar",
        "category": "heat_stress",
        "severity": "Moderate",
        "description": "Street market workers experiencing dehydration near Laad Bazaar. Additional water tank requested.",
        "location_name": "Laad Bazaar Arch",
        "lat": 17.3610,
        "lng": 78.4735,
        "has_audio_note": False,
        "timestamp": "1 hour ago",
        "confirm_votes": 6,
        "status": "pending"
    }
]

@router.get("")
def list_reports(ward_id: Optional[str] = None, status: Optional[str] = None):
    results = REPORTS_STORE
    if ward_id:
        results = [r for r in results if r["ward_id"] == ward_id]
    if status:
        results = [r for r in results if r["status"] == status]
    return results

@router.post("")
def submit_report(payload: CitizenReportSubmission):
    new_id = f"rep-{uuid.uuid4().hex[:6]}"
    report = {
        "id": new_id,
        "ward_id": payload.ward_id,
        "ward_name": payload.ward_name,
        "category": payload.category,
        "severity": payload.severity,
        "description": payload.description,
        "location_name": payload.location_name,
        "lat": payload.lat,
        "lng": payload.lng,
        "photo_url": payload.photo_url or "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=500&auto=format&fit=crop&q=60",
        "has_audio_note": payload.has_audio_note,
        "timestamp": "Just now",
        "confirm_votes": 1,
        "status": "pending"
    }
    REPORTS_STORE.insert(0, report)
    return report

@router.post("/{report_id}/confirm")
def confirm_report(report_id: str):
    report = next((r for r in REPORTS_STORE if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report["confirm_votes"] += 1
    # Auto-verify if 5 neighbors confirm
    if report["confirm_votes"] >= 5 and report["status"] == "pending":
        report["status"] = "verified"
        report["verified_by"] = "Community Consensus (5+ Confirmations)"
    return {"id": report_id, "confirm_votes": report["confirm_votes"], "status": report["status"]}

@router.post("/{report_id}/triage")
def triage_report(report_id: str, action: str = Query(..., pattern="^(verify|reject|resolve)$"), reviewer: str = "GHMC Desk Officer"):
    report = next((r for r in REPORTS_STORE if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if action == "verify":
        report["status"] = "verified"
        report["verified_by"] = reviewer
    elif action == "reject":
        report["status"] = "rejected"
    elif action == "resolve":
        report["status"] = "resolved"
        report["resolved_at"] = datetime.utcnow().isoformat() + "Z"

    return report
