import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/reports", tags=["Crowd-Sourced Citizen Ground Truth"])

from api.services import report_db

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

# For backwards compatibility with external scripts, export REPORTS_STORE
# which proxies directly to the persistent SQLite table
def get_reports_store() -> List[dict]:
    return report_db.list_reports()

class _ReportsStoreProxy(list):
    def __iter__(self):
        return iter(report_db.list_reports())
    def __len__(self):
        return len(report_db.list_reports())
    def __getitem__(self, idx):
        return report_db.list_reports()[idx]

REPORTS_STORE = _ReportsStoreProxy()

@router.get("")
def list_reports(ward_id: Optional[str] = None, status: Optional[str] = None):
    return report_db.list_reports(ward_id=ward_id, status=status)

@router.post("")
def submit_report(payload: CitizenReportSubmission):
    return report_db.create_report(
        ward_id=payload.ward_id,
        ward_name=payload.ward_name,
        category=payload.category,
        severity=payload.severity,
        description=payload.description,
        location_name=payload.location_name,
        lat=payload.lat,
        lng=payload.lng,
        photo_url=payload.photo_url or "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=500&auto=format&fit=crop&q=60",
        has_audio_note=payload.has_audio_note
    )

@router.post("/{report_id}/confirm")
def confirm_report(report_id: str):
    report = report_db.confirm_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"id": report_id, "confirm_votes": report["confirm_votes"], "status": report["status"]}

@router.post("/{report_id}/triage")
def triage_report(report_id: str, action: str = Query(..., pattern="^(verify|reject|resolve)$"), reviewer: str = "GHMC Desk Officer"):
    report = report_db.triage_report(report_id, action=action, reviewer=reviewer)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
