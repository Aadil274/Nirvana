import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/alerts", tags=["Alerts & Broadcast Engine"])

class CreateAlertRequest(BaseModel):
    hazard: str  # flood, heat
    severity: str  # Low, Moderate, High, Severe
    title: Dict[str, str]  # {"en": "...", "hi": "...", "te": "..."}
    body: Dict[str, str]
    target_wards: List[str]
    ward_names: List[str]
    channel: str = "in_app"
    requires_two_person_approval: bool = False
    action_checklist: List[str] = []

# In-memory alert store with seeded initial alerts
ALERTS_DB: List[Dict] = [
    {
        "id": "alt-101",
        "hazard": "flood",
        "severity": "Severe",
        "title": {
            "en": "FLASH FLOOD INUNDATION WARNING: Nadeem Colony & Karwan",
            "hi": "अति आवश्यक बाढ़ चेतावनी: नदीम कॉलोनी एवं कारवां",
            "te": "తీవ్ర వరద ముంపు హెచ్చరిక: నదీమ్ కాలనీ మరియు కార్వాన్",
            "ta": "அவசர வெள்ள எச்சரிக்கை: நதீம் காலனி"
        },
        "body": {
            "en": "Expected rainfall of 55mm/hr in the next 3 hours will elevate Shah Hatim basin by 30-45cm. Ground floor residents must move valuables and power disconnects immediately. Relief shelter active at Nadeem Colony Govt High School.",
            "hi": "अगले 3 घंटों में 55 मिमी/घंटा बारिश से जल स्तर 30-45 सेमी बढ़ेगा। भूतल निवासी तुरंत सुरक्षित स्थान पर जाएं।",
            "te": "రాబోయే 3 గంటల్లో 55 మి.మీ/గం వర్షం కురిసే అవకాశం ఉన్నందున లోతట్టు ప్రజలు నదీమ్ కాలనీ హైస్కూల్ పునరావాస కేంద్రానికి వెళ్ళండి.",
            "ta": "அடுத்த 3 மணி நேரத்தில் 55 மிமீ/மணி மழை பெய்யக்கூடும். பாதுகாப்பான முகாமிற்கு செல்லவும்."
        },
        "target_wards": ["ward-72", "ward-71"],
        "ward_names": ["Nadeem Colony", "Karwan / Tolichowki"],
        "issued_at": "2026-10-25T17:45:00Z",
        "valid_until": "2026-10-25T23:00:00Z",
        "channel": "in_app",
        "estimated_reach": 152570,
        "delivery_status": "sent",
        "requires_two_person_approval": False,
        "approved_by": ["Commissioner (Disaster Mgmt)", "Ward 72 Chief Engineer"],
        "action_checklist": [
            "Turn off ground-level electrical circuit breakers",
            "Move medical supplies and identity papers to top floor",
            "Walk via elevated military road to Nadeem High School shelter",
            "Do not walk through moving nala waters"
        ]
    },
    {
        "id": "alt-102",
        "hazard": "flood",
        "severity": "High",
        "title": {
            "en": "MUSI RIVER CAUSEWAY SURGE: Moosarambagh & Amberpet",
            "hi": "मूसी नदी उफान चेतावनी: मुसरंबाग एवं अंबरपेट",
            "te": "మూసీ నది ఉధృతి హెచ్చరిక: మూసారాంబాగ్‌ మరియు అంబర్‌పేట్",
            "ta": "மூசி நதி வெள்ள எச்சரிக்கை: மூசாராம்பாக்"
        },
        "body": {
            "en": "Himayat Sagar surplus gates open. Musi river level at 3.2m (danger mark 4.5m). Causeway closed for vehicular traffic. Avoid lower bank thoroughfares.",
            "hi": "मूसी नदी में पानी बढ़ रहा है। कॉजवे यातायात के लिए बंद है।",
            "te": "మూసీ నది ఉధృతంగా ప్రవహిస్తోంది. కాజ్‌వే మూసివేయబడింది. నదీ పరివాహక ప్రాంతాల ప్రజలు అప్రమత్తంగా ఉండండి.",
            "ta": "மூசி நதியில் நீர்வரத்து அதிகரித்துள்ளது. மக்கள் பாதுகாப்பாக இருக்கவும்."
        },
        "target_wards": ["ward-55", "ward-62"],
        "ward_names": ["Malakpet / Moosarambagh", "Amberpet"],
        "issued_at": "2026-10-25T16:30:00Z",
        "valid_until": "2026-10-25T22:00:00Z",
        "channel": "sms",
        "estimated_reach": 158500,
        "delivery_status": "sent",
        "requires_two_person_approval": False,
        "approved_by": ["Circle 6 Disaster Cell"],
        "action_checklist": [
            "Follow police barricades around causeway",
            "Relocate vehicles from basement parking along river strip",
            "Keep mobile phones fully charged"
        ]
    }
]

AUDIT_LOG: List[Dict] = []

@router.get("")
def list_alerts(status: Optional[str] = None):
    if status:
        return [a for a in ALERTS_DB if a["delivery_status"] == status]
    return ALERTS_DB

@router.get("/active")
def get_active_alerts(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    lang: str = "en"
):
    active = [a for a in ALERTS_DB if a["delivery_status"] == "sent"]
    formatted = []
    for a in active:
        item = dict(a)
        # Select appropriate language or fallback to English
        item["active_title"] = a["title"].get(lang, a["title"].get("en", ""))
        item["active_body"] = a["body"].get(lang, a["body"].get("en", ""))
        formatted.append(item)
    return formatted

@router.post("")
def compose_alert(payload: CreateAlertRequest):
    new_id = f"alt-{uuid.uuid4().hex[:6]}"
    is_severe = payload.severity == "Severe"

    alert_obj = {
        "id": new_id,
        "hazard": payload.hazard,
        "severity": payload.severity,
        "title": payload.title,
        "body": payload.body,
        "target_wards": payload.target_wards,
        "ward_names": payload.ward_names,
        "issued_at": datetime.utcnow().isoformat() + "Z",
        "valid_until": (datetime.utcnow() + timedelta(hours=6)).isoformat() + "Z",
        "channel": payload.channel,
        "estimated_reach": len(payload.target_wards) * 75000,
        "delivery_status": "pending_approval" if is_severe else "sent",
        "requires_two_person_approval": is_severe,
        "approved_by": [] if is_severe else ["Operator-Auto"],
        "action_checklist": payload.action_checklist or ["Stay tuned to Nirvana updates", "Avoid low-lying areas"]
    }
    ALERTS_DB.insert(0, alert_obj)

    AUDIT_LOG.append({
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "action": "ALERT_COMPOSED",
        "alert_id": new_id,
        "hazard": payload.hazard,
        "severity": payload.severity,
        "status": alert_obj["delivery_status"]
    })

    return alert_obj

@router.post("/{alert_id}/approve")
def approve_alert(alert_id: str, officer_name: str = "Chief Disaster Officer"):
    alert = next((a for a in ALERTS_DB if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if officer_name not in alert["approved_by"]:
        alert["approved_by"].append(officer_name)

    if len(alert["approved_by"]) >= (2 if alert.get("requires_two_person_approval") else 1):
        alert["delivery_status"] = "sent"

    AUDIT_LOG.append({
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "action": "ALERT_APPROVED",
        "alert_id": alert_id,
        "officer": officer_name,
        "current_status": alert["delivery_status"]
    })

    return alert

@router.post("/{alert_id}/cancel")
def cancel_alert(alert_id: str, reason: str = "Weather subsided - All Clear broadcast"):
    alert = next((a for a in ALERTS_DB if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert["delivery_status"] = "cancelled"
    alert["cancellation_reason"] = reason

    # Create All-Clear message
    all_clear_id = f"alt-clear-{uuid.uuid4().hex[:4]}"
    clear_obj = {
        "id": all_clear_id,
        "hazard": alert["hazard"],
        "severity": "Low",
        "title": {
            "en": f"ALL CLEAR: {', '.join(alert['ward_names'])}",
            "hi": f"स्थिति सामान्य: {', '.join(alert['ward_names'])}",
            "te": f"ముప్పు తొలగింది: {', '.join(alert['ward_names'])}"
        },
        "body": {
            "en": f"Water levels stabilizing. Previous warning cancelled. Reason: {reason}.",
            "hi": "जल स्तर सामान्य हो रहा है। पिछली चेतावनी रद्द की गई।",
            "te": "వరద నీరు తగ్గుముఖం పట్టింది. ముందస్తు హెచ్చరిక ఉపసంహరించబడింది."
        },
        "target_wards": alert["target_wards"],
        "ward_names": alert["ward_names"],
        "issued_at": datetime.utcnow().isoformat() + "Z",
        "valid_until": (datetime.utcnow() + timedelta(hours=3)).isoformat() + "Z",
        "channel": alert["channel"],
        "estimated_reach": alert["estimated_reach"],
        "delivery_status": "sent",
        "requires_two_person_approval": False,
        "approved_by": ["Emergency Override"],
        "action_checklist": ["Return to ground-floor safely", "Inspect electricals before turning on power"]
    }
    ALERTS_DB.insert(0, clear_obj)

    return {"status": "cancelled", "all_clear_alert": clear_obj}

@router.get("/audit-log")
def get_audit_log():
    return AUDIT_LOG
