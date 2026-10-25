from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="", tags=["Auth & Subscriptions"])

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class StaffLogin(BaseModel):
    badge_id_or_email: str
    password: Optional[str] = None

class SubscriptionProfile(BaseModel):
    phone: Optional[str] = None
    ward_id: str
    ward_name: str
    preferred_language: str = "en"
    persona: str = "general"  # outdoor_worker, elderly, low_lying, informal_housing
    channels: List[str] = ["in_app", "sms"]
    quiet_hours_enabled: bool = True
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "06:00"
    consent_given: bool = True
    emergency_contact_phone: Optional[str] = None

SUBSCRIPTIONS_DB = {}

@router.post("/auth/otp/request")
def request_otp(payload: OTPRequest):
    # Mock SMS adapter (Twilio/MSG91 pluggable)
    phone = payload.phone.strip()
    return {
        "status": "success",
        "message": f"6-digit OTP dispatched to {phone}",
        "mock_otp": "421072",
        "provider": "Mock Pluggable SMS Adapter (Twilio/MSG91 ready)"
    }

@router.post("/auth/otp/verify")
def verify_otp(payload: OTPVerify):
    if payload.otp in ["421072", "123456", "999999"]:
        token = f"nirvana_jwt_{uuid.uuid4().hex}"
        return {
            "status": "authenticated",
            "token": token,
            "role": "citizen",
            "phone": payload.phone,
            "profile": {
                "ward_id": "ward-72",
                "ward_name": "Mehdipatnam / Nadeem Colony",
                "language": "en",
                "persona": "low_lying"
            }
        }
    raise HTTPException(status_code=400, detail="Invalid OTP code. Try 421072.")

@router.post("/auth/staff/login")
def staff_login(payload: StaffLogin):
    token = f"staff_jwt_{uuid.uuid4().hex}"
    role = "admin" if "admin" in payload.badge_id_or_email.lower() else "operator"
    return {
        "status": "authenticated",
        "token": token,
        "role": role,
        "user": {
            "name": "Ward 112 Command Officer",
            "badge_id": payload.badge_id_or_email,
            "jurisdiction": "Hyderabad Municipal Command (GHMC)"
        }
    }

@router.post("/subscriptions")
def save_subscription(payload: SubscriptionProfile):
    sub_id = f"sub-{uuid.uuid4().hex[:6]}"
    SUBSCRIPTIONS_DB[sub_id] = payload.dict()
    return {
        "status": "subscribed",
        "subscription_id": sub_id,
        "details": payload.dict()
    }
