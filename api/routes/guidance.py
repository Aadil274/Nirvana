from fastapi import APIRouter, Query

router = APIRouter(prefix="/guidance", tags=["Safety Guidance Engine"])

SAFETY_CMS = {
    "flood": {
        "before": [
            {"title": "Inspect & Clear Sump Pumps", "desc": "Test electrical bilge pumps and verify check-valves are free from silt."},
            {"title": "Elevate Critical Items", "desc": "Move ration supplies, identity documents, and medicines above the 1-meter mark."},
            {"title": "Locate Safe Higher Ground", "desc": "Identify your nearest verified relief school or high-elevation civic hall."}
        ],
        "during": [
            {"title": "Disconnect Main Electricity", "desc": "Trip the main breaker if flood water begins entering the compound."},
            {"title": "Avoid Underpasses & Nalas", "desc": "Never walk or drive into moving water above ankle level (15cm)."},
            {"title": "Follow Higher Ground Routes", "desc": "Move along pre-flagged elevated streets directly toward verified shelters."}
        ],
        "after": [
            {"title": "Inspect Electricals Before Powering", "desc": "Have certified electricians verify wiring before flipping switches."},
            {"title": "Boil Drinking Water", "desc": "Disinfect flood-exposed utensils and boil all municipal tap water for 10 minutes."},
            {"title": "Report Structural Cracks", "desc": "Submit photos of eroded road foundations or culverts to the Nirvana app."}
        ]
    },
    "heat": {
        "before": [
            {"title": "Hydrate With Electrolytes", "desc": "Prepare ORS, lemon water, or buttermilk before morning outdoor shifts."},
            {"title": "Ventilate Living Spaces", "desc": "Open north-facing windows early morning and draw dark curtains by 10 AM."},
            {"title": "Check on Elderly Neighbors", "desc": "Ensure senior residents have adequate water jugs and operable fans."}
        ],
        "during": [
            {"title": "Halt Direct Labor (12 PM - 4 PM)", "desc": "Mandatory shaded rest period during peak UV and thermal radiation."},
            {"title": "Wear Light Loose Cotton", "desc": "Cover head with a damp white towel or wide-brimmed cap."},
            {"title": "Access Free Public Cooling Centers", "desc": "Rest in municipal AC cooling centers or shaded community halls."}
        ],
        "after": [
            {"title": "Rehydrate Slowly", "desc": "Avoid ice-cold water immediately after prolonged sun exposure; sip room-temperature fluids."},
            {"title": "Recognize Heat Stroke Signs", "desc": "Cessation of sweating, confusion, or nausea requires immediate 108 ambulance dispatch."}
        ]
    }
}

EMERGENCY_CONTACTS = [
    {"name": "National Emergency All-in-One", "number": "112", "type": "National", "desc": "Police, Fire, Ambulance 24/7"},
    {"name": "Disaster Medical Ambulance", "number": "108", "type": "Medical", "desc": "Free emergency trauma and resuscitation"},
    {"name": "State Flood / Disaster Helpline", "number": "1070", "type": "State SDMA", "desc": "Telangana State Emergency Operation Center"},
    {"name": "GHMC Municipal Disaster Control Room", "number": "040-2111-1111", "type": "Municipal", "desc": "Hyderabad City monsoon and waterlogging response"},
    {"name": "Women Emergency Helpline", "number": "1091", "type": "Safety", "desc": "24/7 safety and crisis shelter transport"}
]

@router.get("")
def get_guidance(
    hazard: str = Query("flood", pattern="^(flood|heat)$"),
    persona: str = Query("general", pattern="^(general|outdoor_worker|elderly|low_lying|informal_housing)$"),
    lang: str = "en",
    risk_level: str = "High"
):
    hazard_data = SAFETY_CMS.get(hazard, SAFETY_CMS["flood"])

    # Personalization modifiers
    persona_notes = []
    if persona == "outdoor_worker":
        persona_notes.append("Employers are legally mandated to provide shaded rest and hydration stations under the Telangana Heat Action Plan.")
    elif persona == "elderly":
        persona_notes.append("Seniors living alone should notify the Nirvana Ward Champion for automated twice-daily welfare check-ins.")
    elif persona == "low_lying":
        persona_notes.append("Basement sump pits must be inspected hourly; prepare vehicle evacuation before dusk.")

    return {
        "hazard": hazard,
        "persona": persona,
        "risk_level": risk_level,
        "guidance": hazard_data,
        "persona_specific_advisory": persona_notes,
        "emergency_contacts": EMERGENCY_CONTACTS
    }
