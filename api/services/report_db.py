"""
Nirvana Civic Climate Resilience Platform
SQLite Citizen Reports Persistence & Database Layer

Provides atomic storage for crowd-sourced citizen ground-truth reports,
neighbor verification upvotes, photo attachments, and municipal triage status.
"""

import sqlite3
import os
import time
import uuid
from typing import Optional, List, Dict, Any

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
DB_PATH = os.path.join(DATA_DIR, "nirvana_auth.db")

INITIAL_SEED_REPORTS = [
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
        "has_audio_note": 1,
        "timestamp": "12 mins ago",
        "confirm_votes": 14,
        "status": "verified",
        "verified_by": "Ward Champion Farooq",
        "created_at": "2026-10-25T17:48:00Z"
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
        "photo_url": None,
        "has_audio_note": 0,
        "timestamp": "28 mins ago",
        "confirm_votes": 9,
        "status": "verified",
        "verified_by": "GHMC Engineering Squad 4",
        "created_at": "2026-10-25T17:32:00Z"
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
        "photo_url": None,
        "has_audio_note": 1,
        "timestamp": "42 mins ago",
        "confirm_votes": 21,
        "status": "verified",
        "verified_by": "SDRF Team Bravo",
        "created_at": "2026-10-25T17:18:00Z"
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
        "photo_url": None,
        "has_audio_note": 0,
        "timestamp": "1 hour ago",
        "confirm_votes": 6,
        "status": "pending",
        "verified_by": None,
        "created_at": "2026-10-25T17:00:00Z"
    }
]

from contextlib import contextmanager

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    with get_db() as conn:
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS citizen_reports (
                    id TEXT PRIMARY KEY,
                    ward_id TEXT NOT NULL,
                    ward_name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    severity TEXT NOT NULL DEFAULT 'Moderate',
                    description TEXT NOT NULL,
                    location_name TEXT NOT NULL,
                    lat REAL NOT NULL,
                    lng REAL NOT NULL,
                    photo_url TEXT,
                    has_audio_note INTEGER DEFAULT 0,
                    timestamp TEXT NOT NULL,
                    confirm_votes INTEGER DEFAULT 1,
                    status TEXT DEFAULT 'pending',
                    verified_by TEXT,
                    resolved_at TEXT,
                    created_at TEXT NOT NULL
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_reports_ward ON citizen_reports(ward_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_reports_status ON citizen_reports(status)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_reports_created ON citizen_reports(created_at)")

            # Seed initial records if table is completely empty
            cursor = conn.execute("SELECT COUNT(*) FROM citizen_reports")
            count = cursor.fetchone()[0]
            if count == 0:
                for rep in INITIAL_SEED_REPORTS:
                    conn.execute(
                        """
                        INSERT INTO citizen_reports (
                            id, ward_id, ward_name, category, severity, description,
                            location_name, lat, lng, photo_url, has_audio_note, timestamp,
                            confirm_votes, status, verified_by, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            rep["id"], rep["ward_id"], rep["ward_name"], rep["category"],
                            rep["severity"], rep["description"], rep["location_name"],
                            rep["lat"], rep["lng"], rep["photo_url"], rep["has_audio_note"],
                            rep["timestamp"], rep["confirm_votes"], rep["status"],
                            rep["verified_by"], rep["created_at"]
                        )
                    )

# Run initialization upon module load
init_db()

def _format_row(row: sqlite3.Row) -> Dict[str, Any]:
    item = dict(row)
    item["has_audio_note"] = bool(item.get("has_audio_note", 0))
    return item

def list_reports(ward_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
    query = "SELECT * FROM citizen_reports WHERE 1=1"
    params: List[Any] = []
    if ward_id:
        query += " AND ward_id = ?"
        params.append(ward_id)
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY created_at DESC"

    with get_db() as conn:
        rows = conn.execute(query, params).fetchall()
        return [_format_row(r) for r in rows]

def get_report_by_id(report_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM citizen_reports WHERE id = ?", (report_id,)).fetchone()
        if row:
            return _format_row(row)
    return None

def create_report(
    ward_id: str,
    ward_name: str,
    category: str,
    severity: str,
    description: str,
    location_name: str,
    lat: float,
    lng: float,
    photo_url: Optional[str] = None,
    has_audio_note: bool = False
) -> Dict[str, Any]:
    new_id = f"rep-{uuid.uuid4().hex[:6]}"
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    with get_db() as conn:
        with conn:
            conn.execute(
                """
                INSERT INTO citizen_reports (
                    id, ward_id, ward_name, category, severity, description,
                    location_name, lat, lng, photo_url, has_audio_note, timestamp,
                    confirm_votes, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Just now', 1, 'pending', ?)
                """,
                (
                    new_id, ward_id, ward_name, category, severity, description,
                    location_name, lat, lng, photo_url, 1 if has_audio_note else 0,
                    now_iso
                )
            )

    return get_report_by_id(new_id)  # type: ignore

def confirm_report(report_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM citizen_reports WHERE id = ?", (report_id,)).fetchone()
        if not row:
            return None

        votes = row["confirm_votes"] + 1
        new_status = row["status"]
        verified_by = row["verified_by"]

        # Automatic Community Consensus verification at 5 confirmations
        if votes >= 5 and new_status == "pending":
            new_status = "verified"
            verified_by = "Community Consensus (5+ Confirmations)"

        with conn:
            conn.execute(
                "UPDATE citizen_reports SET confirm_votes = ?, status = ?, verified_by = ? WHERE id = ?",
                (votes, new_status, verified_by, report_id)
            )

    return get_report_by_id(report_id)

def triage_report(report_id: str, action: str, reviewer: str = "GHMC Desk Officer") -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM citizen_reports WHERE id = ?", (report_id,)).fetchone()
        if not row:
            return None

        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        if action == "verify":
            status = "verified"
            verified_by = reviewer
            resolved_at = row["resolved_at"]
        elif action == "reject":
            status = "rejected"
            verified_by = reviewer
            resolved_at = row["resolved_at"]
        elif action == "resolve":
            status = "resolved"
            verified_by = row["verified_by"] or reviewer
            resolved_at = now_iso
        else:
            return None

        with conn:
            conn.execute(
                "UPDATE citizen_reports SET status = ?, verified_by = ?, resolved_at = ? WHERE id = ?",
                (status, verified_by, resolved_at, report_id)
            )

    return get_report_by_id(report_id)
