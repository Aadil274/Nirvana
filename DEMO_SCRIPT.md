# Nirvana: 5-Minute Hackathon & Stakeholder Walkthrough Script

This script guides presenters, evaluators, and municipal partners through an end-to-end demo of **Nirvana**, demonstrating hyperlocal climate risk predictions, regional language accessibility, verified citizen ground-truth, and municipal command dispatch.

---

## ⏱️ Minute 0:00 - 0:45: The Problem & The Solution
1. **Show the Landing Page:**
   - *"Across Indian cities, IMD warnings are issued at the district or city level. An orange alert in Hyderabad doesn't tell a resident of Nadeem Colony if their street will submerge, or tell an outdoor vendor in Charminar when wet-bulb heat is lethal."*
   - Point out the **top Civic Advisory bar** and the **Live IMD / NDMA Sync badge**.
   - Note the **warm cream/white tactile aesthetic**—designed for calm, non-alarmist civic clarity.

2. **Multilingual Access:**
   - Click the language selector in the top bar. Switch from English to **తెలుగు (Telugu)**, **हिन्दी (Hindi)**, or **தமிழ் (Tamil)**.
   - Show how the entire UI and advisories adapt instantly with Noto Sans regional typography.

---

## ⏱️ Minute 0:45 - 1:45: Street-Level Dual-Hazard Telemetry
1. **Location Search:**
   - Type `"Nadeem Colony"` or `"Karwan"` in the search bar (or click *"Use My Location"*).
   - Scroll to the **Dual Risk Gauge**:
     - Point out **Flood Inundation (Severe: 28cm expected depth)** side-by-side with **Heat Risk**.
     - Click the timeline chips: **`Now`**, **`+6h`**, **`+24h`**, **`+72h`** to demonstrate temporal risk progression.
2. **Explainability ("Why is my risk high?"):**
   - Scroll to the **Risk Explainer**:
   - Point out the **SHAP feature attribution bars**:
     - Height Above Drainage (HAND): **53.1%** (low basin elevation 498m)
     - 3-Hour Forecast Rain: **18.5%** (55mm convective squall)
     - Topographic Wetness Index (TWI): **12.8%**
     - Choked culvert inlet: **8.3%**
   - *"There is zero black-box mystery. The citizen and the city engineer see the exact same causal factors."*

---

## ⏱️ Minute 1:45 - 2:30: Persona-Tailored Action & Audio Access
1. **Interactive Checklist:**
   - Select the **"Low-Lying Ground Resident"** chip. Notice the action items change to *"Flip main electrical breaker"* and *"Move valuables to upper floor"*.
   - Switch to **"Outdoor Worker"** or **"Senior Citizen"** to demonstrate adaptive guidance.
2. **Audio Bulletin:**
   - Click **"🔊 Listen Action Guide"**. Web Speech API narrates the exact steps clearly.
3. **Simple Mode (for elderly & low-literacy users):**
   - Click **"Simple Mode"** in the top header.
   - Show the ultra-minimal high-contrast screen with giant font, huge **DANGER: EVACUATE NOW** indicator, giant **"LISTEN VOICE"** button, and one-tap emergency call buttons for **112** and **108**.
   - Click *"Exit Simple View"* to return.

---

## ⏱️ Minute 2:30 - 3:30: Interactive Hydrological Map & Verified Shelters
1. **Interactive Vector Map:**
   - Explore the 22 monitored wards in Hyderabad.
   - Click on **Karwan**, **Moosarambagh**, or **Begumpet**. The side drawer immediately displays elevation, drainage condition, and real-time nala overflow risk.
   - Toggle layers: **Flood**, **Heat**, **Shelters**, **Reports**.
   - Click **"Play Forecast Scrubber"** to see animated risk transitions.
2. **Verified Shelters Locator:**
   - Scroll to **Nearby Verified Relief Shelters**.
   - Note the **"Verified by Municipality"** badge vs unverified points.
   - Highlight walking distance, live capacity occupancy bars, and filter by **"⚡ Power Backup"**, **"🩺 Medical Aid"**, or **"🛡️ Women-Safe Wing"**.

---

## ⏱️ Minute 3:30 - 4:15: Crowd-Sourced Ground Truth
1. **Citizen Field Reports:**
   - Show the live feed of citizen-reported waterlogging and choked drains.
   - Click **"+1 Confirm"** on a report—show how 5 confirmations automatically elevate confidence.
2. **Submit a Live Report:**
   - Click **"Report Street Issue"**.
   - Select *"Road Waterlogging"*, set severity to *"Severe"*, add landmark details, and submit.
   - The report appears in the feed instantly and feeds back into the drainage condition layer.

---

## ⏱️ Minute 4:15 - 5:00: Municipal Command Console & Simulation
1. **Switch to Municipal Command Console:**
   - Click **"Municipal Command"** in the header.
   - View real-time KPIs: **5 Wards at Severe**, **342,000 People at Risk**, **16 Shelters Open**.
2. **Interactive Simulation ("What-If"):**
   - Switch to Citizen view or use the **Simulation Bar**:
   - Drag the **Rainfall Intensity slider** from 45 mm/hr to **85 mm/hr**.
   - Click **"Simulate Heavy Rain in Hyderabad"**:
     - Watch risk elevate across the Musi river basin.
     - A new Severe Emergency Deluge alert appears live.
3. **One-Click SitRep Generator:**
   - In Municipal Command, click **"Generate SitRep (1-Click)"** to show the print-ready executive briefing for Disaster Management Commissioners.

---

## 🎯 Wrap-Up Pitch
*"Nirvana bridges the last-mile gap between high-altitude meteorological satellites and vulnerable citizens on ground-floor streets. It is explainable, equitable, multi-lingual, and pilot-ready for Greater Hyderabad and any Indian municipal corporation."*
