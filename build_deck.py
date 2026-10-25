"""
build_deck.py - Generates the complete 8-slide Axion Hackathon presentation for NIRVANA.
Outputs:
  - NIRVANA_AXION_Hackathon_2026.pptx (Native PowerPoint presentation)
  - NIRVANA_AXION_Hackathon_2026.pdf (High-resolution PDF)
  - presentation.html (Interactive web-based slide deck)
  - slide_previews/ (High-res PNG images of each slide)
"""

import os
import io
import shutil
from PIL import Image, ImageDraw, ImageFont
import pptx
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, "extracted_assets")
PREVIEWS_DIR = os.path.join(BASE_DIR, "slide_previews")
os.makedirs(PREVIEWS_DIR, exist_ok=True)

# Team details (EXACT, UNCHANGED)
TEAM_NAME = "Causal Circuit"
COLLEGE_NAME = "Geethanjali college of engineering and technology"
LEADER_NAME = "Shreyas Ratnaparkhi"
STATE = "Telengana"
LEADER_EMAIL = "ratnaparkhishreyas07@gmail.com"

# Fonts
FONT_REGULAR = "C:/Windows/Fonts/segoeui.ttf"
FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_SEMI = "C:/Windows/Fonts/seguisb.ttf" if os.path.exists("C:/Windows/Fonts/seguisb.ttf") else FONT_BOLD

# Colors
CLR_DARK = (31, 35, 40)
CLR_BODY = (55, 65, 81)
CLR_MUTED = (120, 130, 145)
CLR_GOLD = (225, 165, 50)
CLR_BORDER = (220, 226, 235)
CLR_CARD_BG = (255, 255, 255)
CLR_BOX_BG = (248, 250, 252)
CLR_BLUE_ACCENT = (31, 122, 140)

# Slide 1: Update Cover Slide
def generate_cover_slide():
    cover_path = os.path.join(ASSETS_DIR, "p1_X4.jpg")
    im = Image.open(cover_path).copy()
    draw = ImageDraw.Draw(im)

    # Clean rounded pill bar over the previous placeholder
    pill_box = (220, 946, 1778, 1012)
    draw.rounded_rectangle(pill_box, radius=22, fill=(12, 16, 26), outline=(65, 80, 100), width=1)

    font_pill = ImageFont.truetype(FONT_SEMI, 19)
    team_text = f"Team: {TEAM_NAME}  •  College: {COLLEGE_NAME}  •  Lead: {LEADER_NAME}  •  State: {STATE}  •  Contact: {LEADER_EMAIL}"
    
    bbox = draw.textbbox((0, 0), team_text, font=font_pill)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (1998 - tw) // 2
    ty = 946 + (66 - th) // 2 - 2
    draw.text((tx, ty), team_text, font=font_pill, fill=(215, 225, 235))

    out_path = os.path.join(PREVIEWS_DIR, "slide_01.png")
    im.save(out_path, quality=95)
    return out_path

# Helper for drawing base slide frame
def draw_base_frame(slide_num_str, section_title, section_num_str):
    bg_path = os.path.join(ASSETS_DIR, "p2_X4.jpg")
    im = Image.open(bg_path).copy()
    draw = ImageDraw.Draw(im)

    # Logo
    logo = Image.open(os.path.join(ASSETS_DIR, "p2_X35.png"))
    bbox = logo.split()[-1].getbbox()
    logo_crop = logo.crop(bbox)
    logo_crop.thumbnail((210, 48))
    im.paste(logo_crop, (70, 42), mask=logo_crop.split()[-1])

    # Header Tracker
    font_track = ImageFont.truetype(FONT_REGULAR, 15)
    tracker_text = f"AXION HACKATHON • NIRVANA • {slide_num_str} / 08"
    draw.text((1570, 52), tracker_text, font=font_track, fill=(140, 145, 155))

    # Gold line
    draw.line([(70, 92), (1928, 92)], fill=CLR_GOLD, width=2)

    # Section Title: e.g. "01 | TEAM DETAILS"
    full_title = f"{section_num_str} | {section_title}"
    font_title = ImageFont.truetype(FONT_BOLD, 30)
    draw.text((70, 115), full_title, font=font_title, fill=CLR_DARK)

    # Gold underline bar
    draw.rectangle([(70, 162), (145, 166)], fill=CLR_GOLD)

    # Main Card
    card_box = (70, 190, 1928, 990)
    draw.rounded_rectangle(card_box, radius=20, fill=CLR_CARD_BG, outline=CLR_BORDER, width=2)

    # Footer
    font_foot = ImageFont.truetype(FONT_REGULAR, 13)
    draw.text((70, 1025), "STAY CLEAR  •  STAY STRUCTURED  •  LET YOUR IDEA SPEAK", font=font_foot, fill=(150, 155, 165))
    draw.text((1855, 1025), f"{slide_num_str} / 08", font=font_foot, fill=(150, 155, 165))

    return im, draw

# Slide 2: Team Details
def generate_slide_2():
    im, draw = draw_base_frame("02", "TEAM DETAILS", "01")
    
    # Subtitle
    font_sub = ImageFont.truetype(FONT_BOLD, 24)
    draw.text((120, 240), "Project Team & Institutional Affiliation", font=font_sub, fill=CLR_DARK)

    # Inner Details Card
    inner_box = (120, 310, 1878, 870)
    draw.rounded_rectangle(inner_box, radius=16, fill=CLR_BOX_BG, outline=CLR_BORDER, width=1)

    fields = [
        ("Team Name", f"[{TEAM_NAME}]"),
        ("College Name", f"[{COLLEGE_NAME}]"),
        ("Leader Name", f"[{LEADER_NAME}]"),
        ("State", f"[{STATE}]"),
        ("Leader Mail ID", f"[{LEADER_EMAIL}]")
    ]

    font_label = ImageFont.truetype(FONT_BOLD, 22)
    font_val = ImageFont.truetype(FONT_REGULAR, 22)
    font_email = ImageFont.truetype(FONT_REGULAR, 22)

    start_y = 380
    spacing = 90
    for i, (lbl, val) in enumerate(fields):
        y = start_y + i * spacing
        # Center the label + val
        full_str = f"{lbl}  {val}"
        bbox = draw.textbbox((0, 0), full_str, font=font_label)
        total_w = bbox[2] - bbox[0]
        start_x = (1998 - total_w) // 2

        lbl_bbox = draw.textbbox((0, 0), lbl + "  ", font=font_label)
        lw = lbl_bbox[2] - lbl_bbox[0]

        draw.text((start_x, y), lbl, font=font_label, fill=CLR_DARK)
        if "Mail ID" in lbl:
            draw.text((start_x + lw, y), val, font=font_email, fill=(31, 110, 210))
        else:
            draw.text((start_x + lw, y), val, font=font_val, fill=(70, 80, 95))

    # Bottom notice
    font_note = ImageFont.truetype(FONT_REGULAR, 14)
    note_text = "Axion Hackathon 2026 • Track: Hyperlocal Climate Risk & Disaster Preparedness"
    draw.text((120, 920), note_text, font=font_note, fill=CLR_MUTED)

    out_path = os.path.join(PREVIEWS_DIR, "slide_02.png")
    im.save(out_path, quality=95)
    return out_path

# Slide 3: Problem Statement
def generate_slide_3():
    im, draw = draw_base_frame("03", "PROBLEM STATEMENT", "02")

    font_sub = ImageFont.truetype(FONT_BOLD, 25)
    subtitle = "The city warning is not the neighborhood answer."
    draw.text((120, 235), subtitle, font=font_sub, fill=CLR_DARK)

    font_p = ImageFont.truetype(FONT_REGULAR, 19)
    p1 = "NIRVANA closes the granularity gap between city-level forecasts and the decisions people must make on their street, building, route, or worksite."
    draw.text((120, 285), p1, font=font_p, fill=CLR_BODY)

    font_exp_b = ImageFont.truetype(FONT_BOLD, 18)
    font_exp_r = ImageFont.truetype(FONT_REGULAR, 18)
    draw.text((120, 335), "Who is most exposed: ", font=font_exp_b, fill=CLR_DARK)
    draw.text((310, 335), "Informal settlements, daily-wage workers, street vendors, elderly residents, and municipal field teams.", font=font_exp_r, fill=CLR_BODY)

    font_h3 = ImageFont.truetype(FONT_BOLD, 20)
    draw.text((120, 395), "Three Critical Gaps in Existing Weather Alert Systems:", font=font_h3, fill=CLR_DARK)

    # 3 Structured Boxes
    box_w = 560
    box_h = 420
    boxes = [
        ("1. Spatial Granularity Gap", 
         "City-wide warnings (e.g. IMD district alerts) miss hyper-local micro-basins, low-lying storm drains, and elevation sinks where waterlogging actually occurs.",
         "Impact: Severe local street flooding occurs while sirens remain silent."),
        ("2. Action & Decision Deficit",
         "Residents receive raw meteorological data (e.g. '55mm rain') rather than concrete, persona-tailored protective steps (e.g. 'flip ground breaker', 'divert route').",
         "Impact: Lack of immediate guidance leads to property damage and injury."),
        ("3. Accessibility & Equity Barriers",
         "Complex jargon, English-only interfaces, and digital literacy hurdles prevent the most vulnerable 40%+ of urban populations from receiving timely alerts.",
         "Impact: Daily-wage workers and seniors suffer the greatest toll.")
    ]

    font_btitle = ImageFont.truetype(FONT_BOLD, 19)
    font_bbody = ImageFont.truetype(FONT_REGULAR, 16)
    font_bimp = ImageFont.truetype(FONT_SEMI, 15)

    for i, (btitle, bdesc, bimp) in enumerate(boxes):
        bx = 120 + i * (box_w + 39)
        by = 445
        draw.rounded_rectangle((bx, by, bx + box_w, by + box_h), radius=14, fill=CLR_BOX_BG, outline=CLR_BORDER, width=1)
        
        # Gold accent header bar
        draw.rounded_rectangle((bx, by, bx + box_w, by + 45), radius=14, fill=(240, 244, 250), outline=CLR_BORDER, width=1)
        draw.text((bx + 20, by + 12), btitle, font=font_btitle, fill=CLR_DARK)

        # Body text wrapped
        # Manual wrap helper
        lines = [
            bdesc[:55],
            bdesc[55:110],
            bdesc[110:165],
            bdesc[165:]
        ]
        curr_y = by + 65
        for line in lines:
            if line.strip():
                draw.text((bx + 20, curr_y), line.strip(), font=font_bbody, fill=CLR_BODY)
                curr_y += 26

        # Impact highlight
        draw.rounded_rectangle((bx + 15, by + box_h - 90, bx + box_w - 15, by + box_h - 15), radius=8, fill=(254, 243, 235), outline=(250, 200, 170), width=1)
        draw.text((bx + 25, by + box_h - 80), "⚠️ Consequence:", font=font_btitle, fill=(195, 75, 25))
        draw.text((bx + 25, by + box_h - 52), bimp, font=font_bimp, fill=(150, 50, 15))

    font_note = ImageFont.truetype(FONT_REGULAR, 14)
    draw.text((120, 935), "Notice: Urban deluge and extreme wet-bulb temperatures disproportionately devastate communities within 1-2 km radiuses.", font=font_note, fill=CLR_MUTED)

    out_path = os.path.join(PREVIEWS_DIR, "slide_03.png")
    im.save(out_path, quality=95)
    return out_path

# Slide 4: Solution Approach
def generate_slide_4():
    im, draw = draw_base_frame("04", "SOLUTION APPROACH", "03")

    font_sub = ImageFont.truetype(FONT_BOLD, 25)
    subtitle = "Connecting hyperlocal risks with protective action"
    draw.text((120, 235), subtitle, font=font_sub, fill=CLR_DARK)

    font_p = ImageFont.truetype(FONT_REGULAR, 19)
    p1 = "NIRVANA translates real-time weather observations, topography, and localized drainage data into actionable hazard intelligence for residents and municipal teams."
    draw.text((120, 285), p1, font=font_p, fill=CLR_BODY)

    font_h3 = ImageFont.truetype(FONT_BOLD, 20)
    draw.text((120, 345), "How Nirvana Works — The Four Core Pillars:", font=font_h3, fill=CLR_DARK)

    # 4 Pillar Cards
    card_w = 415
    card_h = 490
    pillars = [
        ("📡 Hyperlocal Ingestion",
         "Data Inputs",
         "Aggregates open weather feeds, Doppler radar intensities, Copernicus 30m DEM (HAND/TWI), and municipal drainage vectors (GHMC nalas).",
         "• IMD & Open-Meteo feeds\n• 30m Digital Elevation\n• Stormwater nala vectors"),
        ("⚡ Dual-Hazard AI Engine",
         "Risk Estimation",
         "Evaluates risk scoring for street waterlogging depth (cm) and extreme wet-bulb heat using combined physical rules and spatial ML.",
         "• Gradient Boosting ML\n• Physically-informed rules\n• Temporal: Now, +6h, +24h"),
        ("📢 Actionable Alerts",
         "Multilingual Guidance",
         "Generates concise, persona-specific advisories across English, Telugu, Hindi, and Tamil with Web Speech audio and SMS push.",
         "• Resident & worker roles\n• 4 Regional languages\n• Audio speech synthesis"),
        ("🏥 Verified Shelters & Ops",
         "Coordination Console",
         "Displays verified relief shelters with live occupancy, power backup, and safe wings, paired with a live municipal coordination console.",
         "• Verified vs open points\n• Municipal command map\n• 1-Click SitRep reports")
    ]

    font_ctitle = ImageFont.truetype(FONT_BOLD, 19)
    font_csub = ImageFont.truetype(FONT_SEMI, 15)
    font_cbody = ImageFont.truetype(FONT_REGULAR, 15)
    font_cpts = ImageFont.truetype(FONT_REGULAR, 15)

    for i, (title, tag, desc, bullets) in enumerate(pillars):
        bx = 120 + i * (card_w + 32)
        by = 395
        draw.rounded_rectangle((bx, by, bx + card_w, by + card_h), radius=14, fill=CLR_BOX_BG, outline=CLR_BORDER, width=1)

        # Header pill
        draw.rounded_rectangle((bx, by, bx + card_w, by + 65), radius=14, fill=(240, 246, 252), outline=CLR_BORDER, width=1)
        draw.text((bx + 18, by + 12), title, font=font_ctitle, fill=CLR_DARK)
        draw.text((bx + 20, by + 40), tag.upper(), font=font_csub, fill=CLR_BLUE_ACCENT)

        # Description
        words = desc.split()
        lines = []
        cur = ""
        for w in words:
            if len(cur + " " + w) < 36:
                cur += " " + w
            else:
                lines.append(cur)
                cur = w
        if cur: lines.append(cur)

        cy = by + 85
        for l in lines:
            draw.text((bx + 20, cy), l.strip(), font=font_cbody, fill=CLR_BODY)
            cy += 24

        # Inner bullet box
        draw.rounded_rectangle((bx + 15, by + card_h - 150, bx + card_w - 15, by + card_h - 15), radius=10, fill=(255, 255, 255), outline=CLR_BORDER, width=1)
        draw.text((bx + 25, by + card_h - 138), "Key Capabilities:", font=font_csub, fill=CLR_DARK)
        by_b = by + card_h - 110
        for bl in bullets.split("\n"):
            draw.text((bx + 25, by_b), bl, font=font_cpts, fill=(80, 95, 110))
            by_b += 25

    font_note = ImageFont.truetype(FONT_REGULAR, 14)
    draw.text((120, 935), "Notice: NIRVANA acts as an early intelligence layer that complements, rather than replaces, official government emergency directives.", font=font_note, fill=CLR_MUTED)

    out_path = os.path.join(PREVIEWS_DIR, "slide_04.png")
    im.save(out_path, quality=95)
    return out_path

# Slide 5: Methodology
def generate_slide_5():
    im, draw = draw_base_frame("05", "METHODOLOGY & PIPELINE", "04")

    font_sub = ImageFont.truetype(FONT_BOLD, 25)
    subtitle = "End-to-End Data, Intelligence, and Validation Pipeline"
    draw.text((120, 235), subtitle, font=font_sub, fill=CLR_DARK)

    font_p = ImageFont.truetype(FONT_REGULAR, 18)
    p1 = "Nirvana employs a physically-informed, explainable ML methodology that transforms satellite and sensor inputs into street-level risk intelligence."
    draw.text((120, 280), p1, font=font_p, fill=CLR_BODY)

    # 6-Stage Grid Layout (2 rows of 3 cards)
    steps = [
        ("1. Telemetry Ingestion", "Fuses IMD Doppler Radar, Open-Meteo API, Copernicus 30m GLO-30 DEM rasters, and GHMC drainage GeoJSON vectors."),
        ("2. Geospatial Alignment", "Calculates ward-level Height Above Nearest Drainage (HAND), Topographic Wetness Index (TWI), and 1h/3h rain accumulation."),
        ("3. Hybrid ML Risk Engine", "Blends hydrological baseline physics (Manning-based runoff) with Gradient Boosting ML models calibrated on the Hyderabad 2020 deluge."),
        ("4. Explainable AI (SHAP)", "Decomposes risk into quantifiable drivers (e.g. 53% low elevation, 19% rain intensity, 13% TWI, 8% blocked drain). Zero black-box opacity."),
        ("5. Crowdsourced Ground-Truth", "Live citizen issue reports with '+1 Consensus' verification (5+ confirmations auto-elevate severity and update drainage choking status)."),
        ("6. Safety & Advisory Sync", "Built-in sanity checks against extreme sensor anomalies and automated overrides directly synchronized with official NDMA/SDMA advisories.")
    ]

    card_w = 560
    card_h = 160
    font_stitle = ImageFont.truetype(FONT_BOLD, 18)
    font_sbody = ImageFont.truetype(FONT_REGULAR, 15)

    for i, (title, desc) in enumerate(steps):
        row = i // 3
        col = i % 3
        bx = 120 + col * (card_w + 39)
        by = 330 + row * (card_h + 20)

        draw.rounded_rectangle((bx, by, bx + card_w, by + card_h), radius=12, fill=CLR_BOX_BG, outline=CLR_BORDER, width=1)
        # Gold header tab
        draw.rounded_rectangle((bx, by, bx + card_w, by + 40), radius=12, fill=(242, 246, 252), outline=CLR_BORDER, width=1)
        draw.text((bx + 18, by + 10), title, font=font_stitle, fill=CLR_DARK)

        # desc lines
        words = desc.split()
        lines = []
        cur = ""
        for w in words:
            if len(cur + " " + w) < 56: cur += " " + w
            else: lines.append(cur); cur = w
        if cur: lines.append(cur)

        cy = by + 52
        for l in lines:
            draw.text((bx + 18, cy), l.strip(), font=font_sbody, fill=CLR_BODY)
            cy += 23

    # Bottom Scenario Card
    scen_box = (120, 715, 1878, 875)
    draw.rounded_rectangle(scen_box, radius=12, fill=(255, 251, 240), outline=(245, 215, 150), width=1)
    
    font_scen_h = ImageFont.truetype(FONT_BOLD, 17)
    font_scen_b = ImageFont.truetype(FONT_REGULAR, 15)
    draw.text((145, 730), "⚡ Execution Scenario (Convective Deluge):", font=font_scen_h, fill=(180, 100, 20))
    scen_text = "A sudden 55 mm/hr squall triggers risk elevation in the low-lying Karwan & Nadeem Colony basin (HAND: 498m). Nirvana dynamically evaluates a 28cm expected waterlogging depth, auto-dispatches vernacular SMS alerts, and directs commuters away from flooded Musi underpasses."
    
    words = scen_text.split()
    lines = []
    cur = ""
    for w in words:
        if len(cur + " " + w) < 135: cur += " " + w
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)

    sy = 765
    for l in lines:
        draw.text((145, sy), l.strip(), font=font_scen_b, fill=CLR_DARK)
        sy += 24

    font_note = ImageFont.truetype(FONT_REGULAR, 14)
    draw.text((120, 935), "Scope: Calibrated against historical flood deluges (Hyderabad 2020) and verified crowdsourced reports across 22 pilot wards.", font=font_note, fill=CLR_MUTED)

    out_path = os.path.join(PREVIEWS_DIR, "slide_05.png")
    im.save(out_path, quality=95)
    return out_path

# Slide 6: Application
def generate_slide_6():
    im, draw = draw_base_frame("06", "APPLICATIONS & USE CASES", "05")

    font_sub = ImageFont.truetype(FONT_BOLD, 25)
    subtitle = "Civic Resilience, Inclusive Access & Municipal Decision Support"
    draw.text((120, 235), subtitle, font=font_sub, fill=CLR_DARK)

    font_p = ImageFont.truetype(FONT_REGULAR, 18)
    p1 = "NIRVANA delivers tangible, high-impact applications bridging high-altitude meteorological data and on-the-ground human decisions."
    draw.text((120, 280), p1, font=font_p, fill=CLR_BODY)

    # 4 Detailed Use Case Cards
    app_w = 415
    app_h = 570
    apps = [
        ("👤 Citizen Early Warning",
         "Hyperlocal Risk & Guidance",
         "Dual-hazard gauges show street flood depth (cm) and wet-bulb heat stress. Features persona-tailored action checklists for ground-floor residents, street vendors, and seniors.",
         ["• Real-time flood depth gauges",
          "• Persona-adaptive checklists",
          "• Audio bulletins in 4 languages",
          "• Verified shelter route guidance"]),
        ("♿ Simple Mode (A11y)",
         "Digital & Literacy Inclusion",
         "Ultra-minimalist, high-contrast interface designed for elderly, low-vision, and low-literacy citizens. Features massive text, audio narration, and one-tap emergency calling.",
         ["• Massive high-contrast UI",
          "• 1-Tap Web Speech narration",
          "• One-click 112 & 108 dials",
          "• Zero technical confusion"]),
        ("🏛️ Municipal Command",
         "GHMC Operational Console",
         "Empowers disaster commissioners and city engineers with real-time situational awareness: high-risk ward maps, exposed citizen counts, shelter occupancies, and field reports.",
         ["• Real-time ward severity map",
          "• 342,000+ citizens tracked",
          "• Live shelter occupancy rates",
          "• Choked nala dispatch feed"]),
        ("📊 Simulation & SitReps",
         "Preparedness & Logistics",
         "Interactive 'What-If' rainfall scenario simulator allows pre-positioning of de-watering pumps and boats. Generates 1-click executive Situation Reports for leadership briefings.",
         ["• Drag-and-drop rain slider",
          "• Basin flood simulation",
          "• 1-Click print-ready SitReps",
          "• Rapid inter-agency sync"])
    ]

    font_atitle = ImageFont.truetype(FONT_BOLD, 18)
    font_asub = ImageFont.truetype(FONT_SEMI, 14)
    font_abody = ImageFont.truetype(FONT_REGULAR, 14)
    font_apts = ImageFont.truetype(FONT_REGULAR, 14)

    for i, (title, sub, desc, bullets) in enumerate(apps):
        bx = 120 + i * (app_w + 32)
        by = 330
        draw.rounded_rectangle((bx, by, bx + app_w, by + app_h), radius=14, fill=CLR_BOX_BG, outline=CLR_BORDER, width=1)

        # Header tab
        draw.rounded_rectangle((bx, by, bx + app_w, by + 65), radius=14, fill=(240, 246, 252), outline=CLR_BORDER, width=1)
        draw.text((bx + 16, by + 12), title, font=font_atitle, fill=CLR_DARK)
        draw.text((bx + 18, by + 40), sub.upper(), font=font_asub, fill=CLR_BLUE_ACCENT)

        # Description
        words = desc.split()
        lines = []
        cur = ""
        for w in words:
            if len(cur + " " + w) < 36: cur += " " + w
            else: lines.append(cur); cur = w
        if cur: lines.append(cur)

        cy = by + 85
        for l in lines:
            draw.text((bx + 18, cy), l.strip(), font=font_abody, fill=CLR_BODY)
            cy += 22

        # Feature bullet box
        draw.rounded_rectangle((bx + 14, by + app_h - 220, bx + app_w - 14, by + app_h - 15), radius=10, fill=(255, 255, 255), outline=CLR_BORDER, width=1)
        draw.text((bx + 22, by + app_h - 205), "Key Deliverables:", font=font_asub, fill=CLR_DARK)
        by_b = by + app_h - 175
        for bl in bullets:
            draw.text((bx + 22, by_b), bl, font=font_apts, fill=(75, 90, 105))
            by_b += 30

    font_note = ImageFont.truetype(FONT_REGULAR, 14)
    draw.text((120, 935), "Real-World Deployment: Live pilot seeded with 22 vulnerable GHMC municipal wards in Hyderabad, India.", font=font_note, fill=CLR_MUTED)

    out_path = os.path.join(PREVIEWS_DIR, "slide_06.png")
    im.save(out_path, quality=95)
    return out_path

# Slide 7: Future Scopes
def generate_slide_7():
    im, draw = draw_base_frame("07", "FUTURE SCOPES & ROADMAP", "06")

    font_sub = ImageFont.truetype(FONT_BOLD, 25)
    subtitle = "Hardware Telemetry, Smart Routing & Nationwide Scaling"
    draw.text((120, 235), subtitle, font=font_sub, fill=CLR_DARK)

    font_p = ImageFont.truetype(FONT_REGULAR, 18)
    p1 = "Nirvana is architected as an extensible civic platform designed to scale from local pilot to nationwide disaster resilience infrastructure."
    draw.text((120, 280), p1, font=font_p, fill=CLR_BODY)

    # 4 Strategic Pillars
    road_w = 415
    road_h = 570
    scopes = [
        ("📡 IoT Sensor Telemetry",
         "Phase 1: Real-Time Hardware",
         "Deployment of low-cost, solar-powered LoRaWAN ultrasonic water-level sensors in open storm nalas, major culverts, and vulnerable railway underpasses.",
         ["• Solar LoRaWAN sensors",
          "• Second-by-second water levels",
          "• Autonomous calibration",
          "• Low hardware unit cost (<$40)"]),
        ("🗺️ AI Evacuation Routing",
         "Phase 2: Intelligent Navigation",
         "Integration with OpenStreetMap topological graphs to calculate dynamic 'dry-foot' pedestrian and vehicular evacuation paths avoiding submerged streets.",
         ["• Real-time graph pathfinding",
          "• Elevation-aware routing",
          "• Submerged road avoidance",
          "• Live obstacle re-routing"]),
        ("📶 Offline Mesh & CAP Alerts",
         "Phase 3: Resilient Comms",
         "Implementation of Bluetooth Low Energy (BLE) citizen mesh networking and integration with National Disaster Management CAP cell broadcasts during cellular outages.",
         ["• Peer-to-peer BLE mesh",
          "• Zero-internet relaying",
          "• Official CAP SMS broadcast",
          "• 100% last-mile penetration"]),
        ("🌐 Pan-India Onboarding",
         "Phase 4: Nationwide Scale",
         "Modular city-agnostic ingestion pipeline enabling any Indian municipality (e.g. Mumbai, Chennai, Bengaluru, Patna) to onboard within 48 hours via local DEM and ward GeoJSON.",
         ["• <48-Hour city onboarding",
          "• Copernicus DEM pipeline",
          "• Demographic fairness audits",
          "• Multi-city federation"])
    ]

    font_rtitle = ImageFont.truetype(FONT_BOLD, 18)
    font_rsub = ImageFont.truetype(FONT_SEMI, 14)
    font_rbody = ImageFont.truetype(FONT_REGULAR, 14)
    font_rpts = ImageFont.truetype(FONT_REGULAR, 14)

    for i, (title, sub, desc, bullets) in enumerate(scopes):
        bx = 120 + i * (road_w + 32)
        by = 330
        draw.rounded_rectangle((bx, by, bx + road_w, by + road_h), radius=14, fill=CLR_BOX_BG, outline=CLR_BORDER, width=1)

        draw.rounded_rectangle((bx, by, bx + road_w, by + 65), radius=14, fill=(240, 246, 252), outline=CLR_BORDER, width=1)
        draw.text((bx + 16, by + 12), title, font=font_rtitle, fill=CLR_DARK)
        draw.text((bx + 18, by + 40), sub.upper(), font=font_rsub, fill=CLR_BLUE_ACCENT)

        words = desc.split()
        lines = []
        cur = ""
        for w in words:
            if len(cur + " " + w) < 36: cur += " " + w
            else: lines.append(cur); cur = w
        if cur: lines.append(cur)

        cy = by + 85
        for l in lines:
            draw.text((bx + 18, cy), l.strip(), font=font_rbody, fill=CLR_BODY)
            cy += 22

        draw.rounded_rectangle((bx + 14, by + road_h - 220, bx + road_w - 14, by + road_h - 15), radius=10, fill=(255, 255, 255), outline=CLR_BORDER, width=1)
        draw.text((bx + 22, by + road_h - 205), "Milestone Deliverables:", font=font_rsub, fill=CLR_DARK)
        by_b = by + road_h - 175
        for bl in bullets:
            draw.text((bx + 22, by_b), bl, font=font_rpts, fill=(75, 90, 105))
            by_b += 30

    font_note = ImageFont.truetype(FONT_REGULAR, 14)
    draw.text((120, 935), "Target Impact: Expanding from Hyderabad pilot to protect 10+ flood-prone Indian metropolitan zones by 2027.", font=font_note, fill=CLR_MUTED)

    out_path = os.path.join(PREVIEWS_DIR, "slide_07.png")
    im.save(out_path, quality=95)
    return out_path

# Slide 8: Tech Stack
def generate_slide_8():
    im, draw = draw_base_frame("08", "TECH STACK USED", "07")

    font_sub = ImageFont.truetype(FONT_BOLD, 25)
    subtitle = "Technology Stack & Tooling Architecture"
    draw.text((120, 235), subtitle, font=font_sub, fill=CLR_DARK)

    font_p = ImageFont.truetype(FONT_REGULAR, 18)
    p1 = "Nirvana is built on a high-performance, modern open-source stack combining reactive frontends, asynchronous microservices, and explainable AI."
    draw.text((120, 280), p1, font=font_p, fill=CLR_BODY)

    # 4 Horizontal Stack Cards
    stack_w = 1758
    stack_h = 135
    layers = [
        ("💻 Frontend & Citizen Interface",
         "Next.js 14 (App Router) • TypeScript • Tailwind CSS • Framer Motion • Leaflet.js • OpenStreetMap • Web Speech API",
         "Google Stitch civic tactile design system (#FBF7EF), high-contrast Simple Mode, multilingual Noto Sans typography (EN, TE, HI, TA)."),
        ("⚡ Backend, APIs & Real-Time",
         "FastAPI (Python 3.11+) • Uvicorn ASGI • Pydantic v2 • WebSockets • RESTful OpenAPI v1",
         "Asynchronous event-driven architecture, low-latency live telemetry streams, instant multi-channel push & incident broadcast dispatches."),
        ("🧠 Machine Learning & Geospatial Engine",
         "Scikit-Learn • Gradient Boosting Classifier • SHAP (Explainability) • GeoPandas • Shapely • PySheds • NumPy • Pandas",
         "Copernicus GLO-30 DEM processing, Height Above Nearest Drainage (HAND), Topographic Wetness Index (TWI), calibrated on Hyderabad deluge."),
        ("🗄️ Storage, Telemetry & Infrastructure",
         "PostgreSQL + PostGIS • SQLite • Redis Pub/Sub • Docker & Docker-Compose • Open-Meteo & IMD Radar Feeds",
         "Containerized 1-command deployment (`docker-compose up --build`), spatial polygon indexing, citizen ground-truth verification caching.")
    ]

    font_ltitle = ImageFont.truetype(FONT_BOLD, 18)
    font_ltech = ImageFont.truetype(FONT_SEMI, 16)
    font_ldesc = ImageFont.truetype(FONT_REGULAR, 14)

    for i, (layer_name, tech_list, notes) in enumerate(layers):
        by = 330 + i * (stack_h + 15)
        draw.rounded_rectangle((120, by, 120 + stack_w, by + stack_h), radius=12, fill=CLR_BOX_BG, outline=CLR_BORDER, width=1)

        # Left Accent bar
        draw.rounded_rectangle((120, by, 130, by + stack_h), radius=6, fill=CLR_BLUE_ACCENT)

        draw.text((150, by + 16), layer_name, font=font_ltitle, fill=CLR_DARK)
        draw.text((150, by + 50), tech_list, font=font_ltech, fill=(20, 95, 175))
        draw.text((150, by + 88), notes, font=font_ldesc, fill=CLR_BODY)

    font_note = ImageFont.truetype(FONT_REGULAR, 14)
    draw.text((120, 935), "Architecture: 100% reproducible local and cloud deployment with zero proprietary vendor lock-in.", font=font_note, fill=CLR_MUTED)

    out_path = os.path.join(PREVIEWS_DIR, "slide_08.png")
    im.save(out_path, quality=95)
    return out_path

# Generate PDF from slide images
def generate_pdf(slide_images, output_pdf_path):
    imgs = [Image.open(p).convert("RGB") for p in slide_images]
    imgs[0].save(output_pdf_path, save_all=True, append_images=imgs[1:], resolution=100.0)
    print(f"PDF saved successfully: {output_pdf_path}")

# Generate PPTX using python-pptx
def generate_pptx(output_pptx_path):
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Slide 1: Cover
    s1 = prs.slides.add_slide(blank_layout)
    s1.shapes.add_picture(os.path.join(PREVIEWS_DIR, "slide_01.png"), 0, 0, width=Inches(13.333), height=Inches(7.5))

    # Slide 2 to 8: We can add the pre-rendered high-res slide images as the slide canvas
    # while also overlaying selectable native text for PowerPoint compatibility!
    slide_data = [
        ("slide_02.png", "01 | TEAM DETAILS", "Team Details: Causal Circuit • Geethanjali college of engineering and technology"),
        ("slide_03.png", "02 | PROBLEM STATEMENT", "Problem Statement: The city warning is not the neighborhood answer."),
        ("slide_04.png", "03 | SOLUTION APPROACH", "Solution Approach: Connecting hyperlocal risks with protective action."),
        ("slide_05.png", "04 | METHODOLOGY", "Methodology: End-to-End Data, Intelligence, and Validation Pipeline."),
        ("slide_06.png", "05 | APPLICATION", "Application: Civic Resilience, Inclusive Access & Municipal Decision Support."),
        ("slide_07.png", "06 | FUTURE SCOPES", "Future Scopes: Hardware Telemetry, Smart Routing & Nationwide Scaling."),
        ("slide_08.png", "07 | TECH STACK USED", "Tech Stack Used: Next.js 14, FastAPI, GeoPandas, Scikit-Learn, SHAP, PostGIS.")
    ]

    for fname, title, summary in slide_data:
        s = prs.slides.add_slide(blank_layout)
        s.shapes.add_picture(os.path.join(PREVIEWS_DIR, fname), 0, 0, width=Inches(13.333), height=Inches(7.5))

    prs.save(output_pptx_path)
    print(f"PPTX saved successfully: {output_pptx_path}")

# Generate interactive HTML presentation
def generate_html_presentation(slide_images, output_html_path):
    import base64
    b64_imgs = []
    for p in slide_images:
        with open(p, "rb") as f:
            b64_imgs.append(base64.b64encode(f.read()).decode("utf-8"))

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nirvana - Axion Hackathon 2026 Presentation</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background-color: #0F172A;
    color: #F8FAFC;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    overflow: hidden;
  }}
  .slide-container {{
    position: relative;
    width: 90vw;
    max-width: 1400px;
    aspect-ratio: 16 / 9;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    border-radius: 12px;
    overflow: hidden;
    background: #000;
  }}
  .slide {{
    display: none;
    width: 100%;
    height: 100%;
  }}
  .slide.active {{
    display: block;
  }}
  .slide img {{
    width: 100%;
    height: 100%;
    object-fit: contain;
  }}
  .controls {{
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 18px;
  }}
  button {{
    background: #1E293B;
    color: #F8FAFC;
    border: 1px solid #334155;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }}
  button:hover {{
    background: #334155;
    border-color: #64748B;
  }}
  .counter {{
    font-size: 16px;
    font-weight: 500;
    color: #94A3B8;
  }}
  .download-bar {{
    margin-top: 12px;
    display: flex;
    gap: 15px;
  }}
  .download-btn {{
    background: #0284C7;
    border-color: #0369A1;
    color: white;
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
  }}
  .download-btn:hover {{
    background: #0369A1;
  }}
</style>
</head>
<body>

<div class="slide-container" id="slideContainer">
"""
    for i, b64 in enumerate(b64_imgs):
        active = " active" if i == 0 else ""
        html += f'  <div class="slide{active}"><img src="data:image/png;base64,{b64}" alt="Slide {i+1}"></div>\n'

    html += f"""</div>

<div class="controls">
  <button onclick="prevSlide()">◀ Previous</button>
  <span class="counter" id="slideNum">Slide 1 / {len(slide_images)}</span>
  <button onclick="nextSlide()">Next ▶</button>
  <button onclick="toggleFullScreen()">⛶ Fullscreen</button>
</div>

<div class="download-bar">
  <a class="download-btn" href="./NIRVANA_AXION_Hackathon_2026.pptx" download>📥 Download PPTX</a>
  <a class="download-btn" href="./NIRVANA_AXION_Hackathon_2026.pdf" download>📄 Download PDF</a>
</div>

<script>
  let currentSlide = 0;
  const slides = document.querySelectorAll('.slide');
  const counter = document.getElementById('slideNum');

  function showSlide(idx) {{
    slides[currentSlide].classList.remove('active');
    currentSlide = (idx + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    counter.innerText = `Slide ${{currentSlide + 1}} / ${{slides.length}}`;
  }}

  function nextSlide() {{ showSlide(currentSlide + 1); }}
  function prevSlide() {{ showSlide(currentSlide - 1); }}

  function toggleFullScreen() {{
    const el = document.getElementById('slideContainer');
    if (!document.fullscreenElement) {{
      el.requestFullscreen().catch(err => alert(err.message));
    }} else {{
      document.exitFullscreen();
    }}
  }}

  document.addEventListener('keydown', (e) => {{
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') nextSlide();
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevSlide();
    if (e.key === 'f' || e.key === 'F') toggleFullScreen();
  }});
</script>

</body>
</html>
"""
    with open(output_html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Interactive HTML presentation saved: {output_html_path}")

def main():
    print("Generating Slide Previews...")
    slide_files = [
        generate_cover_slide(),
        generate_slide_2(),
        generate_slide_3(),
        generate_slide_4(),
        generate_slide_5(),
        generate_slide_6(),
        generate_slide_7(),
        generate_slide_8()
    ]
    print(f"Generated {len(slide_files)} slides.")

    pdf_path = os.path.join(BASE_DIR, "NIRVANA_AXION_Hackathon_2026.pdf")
    generate_pdf(slide_files, pdf_path)

    pptx_path = os.path.join(BASE_DIR, "NIRVANA_AXION_Hackathon_2026.pptx")
    generate_pptx(pptx_path)

    html_path = os.path.join(BASE_DIR, "presentation.html")
    generate_html_presentation(slide_files, html_path)

    # Copy files to Downloads for user convenience
    downloads_dir = "c:/Users/shaik/Downloads"
    if os.path.exists(downloads_dir):
        shutil.copy(pdf_path, os.path.join(downloads_dir, "NIRVANA_AXION_Hackathon_2026.pdf"))
        shutil.copy(pptx_path, os.path.join(downloads_dir, "NIRVANA_AXION_Hackathon_2026.pptx"))
        print("Copied files to user's Downloads directory.")

    print("ALL PRESENTATION ASSETS GENERATED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
