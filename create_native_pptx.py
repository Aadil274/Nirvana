"""
create_native_pptx.py - Builds a 100% native, fully editable PowerPoint (.pptx) file
where every slide contains true text frames, formatted paragraphs, shapes, and colors.
"""

import os
import pptx
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, "extracted_assets")
PREVIEWS_DIR = os.path.join(BASE_DIR, "slide_previews")

# Team Details (Unchanged)
TEAM_NAME = "Causal Circuit"
COLLEGE_NAME = "Geethanjali college of engineering and technology"
LEADER_NAME = "Shreyas Ratnaparkhi"
STATE = "Telengana"
LEADER_EMAIL = "ratnaparkhishreyas07@gmail.com"

# Design Tokens
FONT_HEADING = "Segoe UI"
FONT_BODY = "Segoe UI"
COLOR_TITLE = RGBColor(31, 35, 40)
COLOR_SUBTITLE = RGBColor(30, 41, 59)
COLOR_BODY = RGBColor(71, 85, 105)
COLOR_MUTED = RGBColor(148, 163, 184)
COLOR_GOLD = RGBColor(225, 165, 50)
COLOR_BORDER = RGBColor(226, 232, 240)
COLOR_CARD_FILL = RGBColor(255, 255, 255)
COLOR_INNER_FILL = RGBColor(248, 250, 252)
COLOR_TEAL = RGBColor(31, 122, 140)
COLOR_BLUE = RGBColor(2, 132, 199)

def add_base_slide(prs, slide_num, total_slides, section_num, section_title):
    slide = prs.slides.add_slide(prs.slide_layouts[6]) # blank layout

    # Background canvas
    bg_img = os.path.join(ASSETS_DIR, "p2_X4.jpg")
    slide.shapes.add_picture(bg_img, 0, 0, width=Inches(13.333), height=Inches(7.5))

    # STAMPERS Logo top-left
    logo_img = os.path.join(ASSETS_DIR, "p2_X35.png")
    if os.path.exists(logo_img):
        slide.shapes.add_picture(logo_img, Inches(0.55), Inches(0.28), width=Inches(1.5), height=Inches(0.21))

    # Tracker top-right
    tracker_box = slide.shapes.add_textbox(Inches(8.5), Inches(0.25), Inches(4.3), Inches(0.35))
    tf_tr = tracker_box.text_frame
    tf_tr.word_wrap = False
    p_tr = tf_tr.paragraphs[0]
    p_tr.text = f"AXION HACKATHON • NIRVANA • {slide_num:02d} / {total_slides:02d}"
    p_tr.alignment = PP_ALIGN.RIGHT
    p_tr.font.name = FONT_BODY
    p_tr.font.size = Pt(10)
    p_tr.font.color.rgb = COLOR_MUTED

    # Gold separator line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.55), Inches(0.62), Inches(12.23), Inches(0.015))
    line.fill.solid()
    line.fill.fore_color.rgb = COLOR_GOLD
    line.line.color.rgb = COLOR_GOLD

    # Section Title
    title_box = slide.shapes.add_textbox(Inches(0.55), Inches(0.72), Inches(10), Inches(0.55))
    tf_t = title_box.text_frame
    p_t = tf_t.paragraphs[0]
    p_t.text = f"{section_num:02d} | {section_title}"
    p_t.font.name = FONT_HEADING
    p_t.font.size = Pt(22)
    p_t.font.bold = True
    p_t.font.color.rgb = COLOR_TITLE

    # Gold underline bar
    ubar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.55), Inches(1.18), Inches(0.55), Inches(0.04))
    ubar.fill.solid()
    ubar.fill.fore_color.rgb = COLOR_GOLD
    ubar.line.color.rgb = COLOR_GOLD

    # Main Card
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.55), Inches(1.35), Inches(12.23), Inches(5.45))
    card.fill.solid()
    card.fill.fore_color.rgb = COLOR_CARD_FILL
    card.line.color.rgb = COLOR_BORDER
    card.line.width = Pt(1.5)

    # Footer Left
    foot_box = slide.shapes.add_textbox(Inches(0.55), Inches(6.92), Inches(8), Inches(0.35))
    tf_f = foot_box.text_frame
    p_f = tf_f.paragraphs[0]
    p_f.text = "STAY CLEAR • STAY STRUCTURED • LET YOUR IDEA SPEAK"
    p_f.font.name = FONT_BODY
    p_f.font.size = Pt(9.5)
    p_f.font.color.rgb = COLOR_MUTED

    # Footer Right
    num_box = slide.shapes.add_textbox(Inches(11.0), Inches(6.92), Inches(1.78), Inches(0.35))
    tf_n = num_box.text_frame
    p_n = tf_n.paragraphs[0]
    p_n.text = f"{slide_num:02d} / {total_slides:02d}"
    p_n.alignment = PP_ALIGN.RIGHT
    p_n.font.name = FONT_BODY
    p_n.font.size = Pt(9.5)
    p_n.font.color.rgb = COLOR_MUTED

    return slide

def build_full_native_pptx(output_path):
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # ==================== SLIDE 1: COVER ====================
    s1 = prs.slides.add_slide(blank_layout)
    cover_img = os.path.join(PREVIEWS_DIR, "slide_01.png")
    s1.shapes.add_picture(cover_img, 0, 0, width=Inches(13.333), height=Inches(7.5))

    # Add invisible/selectable native text box over cover for accessibility
    tb_c = s1.shapes.add_textbox(Inches(1.5), Inches(6.25), Inches(10.33), Inches(0.55))
    tf_c = tb_c.text_frame
    p_c = tf_c.paragraphs[0]
    p_c.text = f"Team: {TEAM_NAME}  •  College: {COLLEGE_NAME}  •  Lead: {LEADER_NAME}  •  State: {STATE}  •  Contact: {LEADER_EMAIL}"
    p_c.alignment = PP_ALIGN.CENTER
    p_c.font.name = FONT_BODY
    p_c.font.size = Pt(11)
    p_c.font.color.rgb = RGBColor(220, 230, 240)

    # ==================== SLIDE 2: TEAM DETAILS ====================
    s2 = add_base_slide(prs, 2, 8, 1, "TEAM DETAILS")

    # Subtitle
    tb_s2 = s2.shapes.add_textbox(Inches(0.9), Inches(1.55), Inches(11.5), Inches(0.45))
    p = tb_s2.text_frame.paragraphs[0]
    p.text = "Project Team & Institutional Affiliation"
    p.font.name = FONT_HEADING
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = COLOR_TITLE

    # Inner Details Card
    inner_card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(2.15), Inches(11.33), Inches(4.0))
    inner_card.fill.solid()
    inner_card.fill.fore_color.rgb = COLOR_INNER_FILL
    inner_card.line.color.rgb = COLOR_BORDER

    # Details Text Box
    dt_box = s2.shapes.add_textbox(Inches(1.5), Inches(2.4), Inches(10.33), Inches(3.5))
    tf_d = dt_box.text_frame
    tf_d.word_wrap = True

    fields = [
        ("Team Name", f"[{TEAM_NAME}]"),
        ("College Name", f"[{COLLEGE_NAME}]"),
        ("Leader Name", f"[{LEADER_NAME}]"),
        ("State", f"[{STATE}]"),
        ("Leader Mail ID", f"[{LEADER_EMAIL}]")
    ]

    for i, (label, val) in enumerate(fields):
        p = tf_d.paragraphs[0] if i == 0 else tf_d.add_paragraph()
        p.alignment = PP_ALIGN.CENTER
        p.space_after = Pt(20)

        run_l = p.add_run()
        run_l.text = f"{label} "
        run_l.font.name = FONT_HEADING
        run_l.font.size = Pt(18)
        run_l.font.bold = True
        run_l.font.color.rgb = COLOR_TITLE

        run_v = p.add_run()
        run_v.text = val
        run_v.font.name = FONT_BODY
        run_v.font.size = Pt(18)
        if "Mail ID" in label:
            run_v.font.color.rgb = COLOR_BLUE
        else:
            run_v.font.color.rgb = COLOR_BODY

    # Bottom notice
    nt_box = s2.shapes.add_textbox(Inches(0.9), Inches(6.35), Inches(11.5), Inches(0.35))
    p_nt = nt_box.text_frame.paragraphs[0]
    p_nt.text = "Axion Hackathon 2026 • Submission Track: Hyperlocal Climate Risk & Disaster Preparedness"
    p_nt.font.name = FONT_BODY
    p_nt.font.size = Pt(10)
    p_nt.font.color.rgb = COLOR_MUTED

    # ==================== SLIDE 3: PROBLEM STATEMENT ====================
    s3 = add_base_slide(prs, 3, 8, 2, "PROBLEM STATEMENT")

    tb_s3 = s3.shapes.add_textbox(Inches(0.9), Inches(1.5), Inches(11.5), Inches(1.2))
    tf3 = tb_s3.text_frame
    tf3.word_wrap = True

    p1 = tf3.paragraphs[0]
    p1.text = "The city warning is not the neighborhood answer."
    p1.font.name = FONT_HEADING
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_TITLE
    p1.space_after = Pt(4)

    p2 = tf3.add_paragraph()
    p2.text = "NIRVANA closes the granularity gap between city-level forecasts and the decisions people must make on their street, building, route, or worksite."
    p2.font.name = FONT_BODY
    p2.font.size = Pt(13)
    p2.font.color.rgb = COLOR_BODY
    p2.space_after = Pt(6)

    p3 = tf3.add_paragraph()
    r3a = p3.add_run()
    r3a.text = "Who is most exposed: "
    r3a.font.bold = True
    r3a.font.size = Pt(12)
    r3a.font.color.rgb = COLOR_TITLE
    r3b = p3.add_run()
    r3b.text = "Informal settlements, daily-wage workers, street vendors, elderly residents, and municipal field teams."
    r3b.font.size = Pt(12)
    r3b.font.color.rgb = COLOR_BODY

    # 3 Gap Cards
    gap_boxes = [
        ("1. Spatial Granularity Gap",
         "City-wide warnings (e.g. IMD district alerts) miss hyper-local micro-basins, low-lying storm drains, and elevation sinks where waterlogging actually occurs.",
         "Consequence: Streets submerge while sirens remain silent."),
        ("2. Action & Decision Deficit",
         "Residents receive raw meteorological numbers (e.g. '55mm rain') rather than concrete, persona-tailored protective guidance (e.g. 'flip ground breaker', 'divert route').",
         "Consequence: Lack of immediate steps leads to property loss."),
        ("3. Accessibility & Equity Barriers",
         "Complex scientific jargon, English-only alerts, and digital literacy divides leave the most vulnerable 40%+ of urban populations completely unassisted.",
         "Consequence: Marginalized communities suffer the highest toll.")
    ]

    card_w = Inches(3.6)
    card_h = Inches(3.4)
    for i, (gtitle, gdesc, gcons) in enumerate(gap_boxes):
        cx = Inches(0.9 + i * 3.85)
        cy = Inches(2.8)

        bx = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, cy, card_w, card_h)
        bx.fill.solid()
        bx.fill.fore_color.rgb = COLOR_INNER_FILL
        bx.line.color.rgb = COLOR_BORDER

        tb = s3.shapes.add_textbox(cx + Inches(0.15), cy + Inches(0.15), card_w - Inches(0.3), card_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        pt = tf.paragraphs[0]
        pt.text = gtitle
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(13)
        pt.font.bold = True
        pt.font.color.rgb = COLOR_TITLE
        pt.space_after = Pt(8)

        pd = tf.add_paragraph()
        pd.text = gdesc
        pd.font.name = FONT_BODY
        pd.font.size = Pt(11)
        pd.font.color.rgb = COLOR_BODY
        pd.space_after = Pt(12)

        pc = tf.add_paragraph()
        rc1 = pc.add_run()
        rc1.text = "⚠️ " + gcons.split(":")[0] + ": "
        rc1.font.bold = True
        rc1.font.size = Pt(10.5)
        rc1.font.color.rgb = RGBColor(194, 65, 12)
        rc2 = pc.add_run()
        rc2.text = gcons.split(":")[1]
        rc2.font.size = Pt(10.5)
        rc2.font.color.rgb = RGBColor(154, 52, 18)

    # Footnote
    nt3 = s3.shapes.add_textbox(Inches(0.9), Inches(6.35), Inches(11.5), Inches(0.35))
    nt3.text_frame.paragraphs[0].text = "Notice: Urban deluge and extreme wet-bulb temperatures disproportionately devastate communities within 1-2 km radiuses."
    nt3.text_frame.paragraphs[0].font.size = Pt(10)
    nt3.text_frame.paragraphs[0].font.color.rgb = COLOR_MUTED

    # ==================== SLIDE 4: SOLUTION APPROACH ====================
    s4 = add_base_slide(prs, 4, 8, 3, "SOLUTION APPROACH")

    tb_s4 = s4.shapes.add_textbox(Inches(0.9), Inches(1.5), Inches(11.5), Inches(1.1))
    tf4 = tb_s4.text_frame
    tf4.word_wrap = True

    p1 = tf4.paragraphs[0]
    p1.text = "Connecting Hyperlocal Risks with Protective Community Action"
    p1.font.name = FONT_HEADING
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_TITLE
    p1.space_after = Pt(4)

    p2 = tf4.add_paragraph()
    p2.text = "NIRVANA translates real-time weather observations, topography, and localized drainage data into actionable hazard intelligence for residents and municipal teams."
    p2.font.name = FONT_BODY
    p2.font.size = Pt(13)
    p2.font.color.rgb = COLOR_BODY

    # 4 Pillar Cards
    pillars = [
        ("📡 Hyperlocal Ingestion", "Data Inputs",
         "Aggregates open weather feeds, Doppler radar intensities, Copernicus 30m DEM (HAND/TWI), and municipal drainage vectors.",
         ["• IMD & Open-Meteo feeds", "• 30m Digital Elevation", "• Stormwater nala vectors"]),
        ("⚡ Dual-Hazard AI Engine", "Risk Estimation",
         "Evaluates risk scoring for street waterlogging depth (cm) and extreme wet-bulb heat using physical rules and spatial ML.",
         ["• Gradient Boosting ML", "• Physics-informed rules", "• Horizons: Now, +6h, +24h"]),
        ("📢 Actionable Alerts", "Multilingual Guidance",
         "Generates concise, persona-specific advisories across English, Telugu, Hindi, and Tamil with Web Speech audio and SMS push.",
         ["• Persona-tailored steps", "• 4 Regional languages", "• Audio speech synthesis"]),
        ("🏥 Verified Shelters & Ops", "Coordination Console",
         "Displays verified relief shelters with live occupancy, power backup, and safe wings, paired with a municipal command console.",
         ["• Verified relief points", "• Municipal command map", "• 1-Click SitRep reports"])
    ]

    cw4 = Inches(2.72)
    ch4 = Inches(3.55)
    for i, (ptitle, psub, pdesc, pbts) in enumerate(pillars):
        cx = Inches(0.9 + i * 2.92)
        cy = Inches(2.7)

        bx = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, cy, cw4, ch4)
        bx.fill.solid()
        bx.fill.fore_color.rgb = COLOR_INNER_FILL
        bx.line.color.rgb = COLOR_BORDER

        tb = s4.shapes.add_textbox(cx + Inches(0.12), cy + Inches(0.12), cw4 - Inches(0.24), ch4 - Inches(0.24))
        tf = tb.text_frame
        tf.word_wrap = True

        pt = tf.paragraphs[0]
        pt.text = ptitle
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12.5)
        pt.font.bold = True
        pt.font.color.rgb = COLOR_TITLE

        ps = tf.add_paragraph()
        ps.text = psub.upper()
        ps.font.name = FONT_BODY
        ps.font.size = Pt(9.5)
        ps.font.bold = True
        ps.font.color.rgb = COLOR_TEAL
        ps.space_after = Pt(6)

        pd = tf.add_paragraph()
        pd.text = pdesc
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = COLOR_BODY
        pd.space_after = Pt(8)

        for b in pbts:
            pb = tf.add_paragraph()
            pb.text = b
            pb.font.name = FONT_BODY
            pb.font.size = Pt(10)
            pb.font.color.rgb = RGBColor(51, 65, 85)

    nt4 = s4.shapes.add_textbox(Inches(0.9), Inches(6.35), Inches(11.5), Inches(0.35))
    nt4.text_frame.paragraphs[0].text = "Notice: NIRVANA acts as an early intelligence layer that complements, rather than replaces, official government emergency directives."
    nt4.text_frame.paragraphs[0].font.size = Pt(10)
    nt4.text_frame.paragraphs[0].font.color.rgb = COLOR_MUTED

    # ==================== SLIDE 5: METHODOLOGY ====================
    s5 = add_base_slide(prs, 5, 8, 4, "METHODOLOGY & PIPELINE")

    tb_s5 = s5.shapes.add_textbox(Inches(0.9), Inches(1.5), Inches(11.5), Inches(0.85))
    tf5 = tb_s5.text_frame
    tf5.word_wrap = True

    p1 = tf5.paragraphs[0]
    p1.text = "End-to-End Data, Intelligence, and Validation Pipeline"
    p1.font.name = FONT_HEADING
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_TITLE
    p1.space_after = Pt(3)

    p2 = tf5.add_paragraph()
    p2.text = "Nirvana employs a physically-informed, explainable ML methodology transforming telemetry into street-level risk intelligence."
    p2.font.name = FONT_BODY
    p2.font.size = Pt(12.5)
    p2.font.color.rgb = COLOR_BODY

    # 6 Methodology Step Cards (2 rows of 3)
    steps = [
        ("1. Telemetry Ingestion", "Fuses IMD Doppler Radar, Open-Meteo feeds, Copernicus 30m GLO-30 DEM rasters, and GHMC drainage GeoJSON vectors."),
        ("2. Geospatial Alignment", "Calculates ward-level Height Above Nearest Drainage (HAND), Topographic Wetness Index (TWI), and 1h/3h rain accumulation."),
        ("3. Hybrid ML Risk Engine", "Blends hydrological baseline physics (Manning runoff) with Gradient Boosting ML calibrated on the Hyderabad 2020 deluge."),
        ("4. Explainable AI (SHAP)", "Decomposes predictions into quantifiable drivers (53% low elevation, 19% rain intensity, 13% TWI, 8% blocked drain)."),
        ("5. Crowdsourced Ground-Truth", "Live citizen issue reports with '+1 Consensus' verification (5+ confirmations auto-elevate severity and update drain status)."),
        ("6. Safety & Advisory Sync", "Built-in sanity checks against extreme sensor anomalies and automated overrides directly synchronized with official NDMA/SDMA advisories.")
    ]

    sw5 = Inches(3.65)
    sh5 = Inches(1.3)
    for i, (stitle, sdesc) in enumerate(steps):
        row = i // 3
        col = i % 3
        cx = Inches(0.9 + col * 3.9)
        cy = Inches(2.45 + row * 1.45)

        bx = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, cy, sw5, sh5)
        bx.fill.solid()
        bx.fill.fore_color.rgb = COLOR_INNER_FILL
        bx.line.color.rgb = COLOR_BORDER

        tb = s5.shapes.add_textbox(cx + Inches(0.1), cy + Inches(0.08), sw5 - Inches(0.2), sh5 - Inches(0.16))
        tf = tb.text_frame
        tf.word_wrap = True

        pt = tf.paragraphs[0]
        pt.text = stitle
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = COLOR_TITLE
        pt.space_after = Pt(2)

        pd = tf.add_paragraph()
        pd.text = sdesc
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10)
        pd.font.color.rgb = COLOR_BODY

    # Execution Scenario Box
    scen_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.9), Inches(5.45), Inches(11.45), Inches(0.85))
    scen_card.fill.solid()
    scen_card.fill.fore_color.rgb = RGBColor(255, 251, 235)
    scen_card.line.color.rgb = RGBColor(245, 208, 115)

    tb_sc = s5.shapes.add_textbox(Inches(1.05), Inches(5.5), Inches(11.15), Inches(0.75))
    tf_sc = tb_sc.text_frame
    tf_sc.word_wrap = True
    psc = tf_sc.paragraphs[0]
    r1 = psc.add_run()
    r1.text = "⚡ Execution Scenario (Convective Deluge): "
    r1.font.bold = True
    r1.font.size = Pt(11)
    r1.font.color.rgb = RGBColor(180, 83, 9)
    r2 = psc.add_run()
    r2.text = "A sudden 55 mm/hr squall triggers risk elevation in the low-lying Karwan basin (HAND: 498m). Nirvana dynamically evaluates a 28cm waterlogging depth, auto-dispatches vernacular SMS alerts, and directs commuters away from flooded Musi underpasses."
    r2.font.size = Pt(10.5)
    r2.font.color.rgb = COLOR_TITLE

    nt5 = s5.shapes.add_textbox(Inches(0.9), Inches(6.35), Inches(11.5), Inches(0.35))
    nt5.text_frame.paragraphs[0].text = "Scope: Calibrated against historical flood deluges (Hyderabad 2020) and verified crowdsourced reports across 22 pilot wards."
    nt5.text_frame.paragraphs[0].font.size = Pt(10)
    nt5.text_frame.paragraphs[0].font.color.rgb = COLOR_MUTED

    # ==================== SLIDE 6: APPLICATION ====================
    s6 = add_base_slide(prs, 6, 8, 5, "APPLICATIONS & USE CASES")

    tb_s6 = s6.shapes.add_textbox(Inches(0.9), Inches(1.5), Inches(11.5), Inches(0.85))
    tf6 = tb_s6.text_frame
    tf6.word_wrap = True

    p1 = tf6.paragraphs[0]
    p1.text = "Civic Resilience, Inclusive Access & Municipal Decision Support"
    p1.font.name = FONT_HEADING
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_TITLE
    p1.space_after = Pt(3)

    p2 = tf6.add_paragraph()
    p2.text = "NIRVANA delivers tangible, high-impact applications bridging high-altitude meteorological data and on-the-ground human decisions."
    p2.font.name = FONT_BODY
    p2.font.size = Pt(12.5)
    p2.font.color.rgb = COLOR_BODY

    # 4 Application Cards
    apps = [
        ("👤 Citizen Early Warning", "Hyperlocal Risk & Action",
         "Dual-hazard gauges show street flood depth (cm) and wet-bulb heat stress. Features persona-tailored action checklists for ground-floor residents, street vendors, and seniors.",
         ["• Real-time flood depth gauges", "• Persona-adaptive checklists", "• Audio bulletins in 4 languages", "• Verified shelter route guidance"]),
        ("♿ Simple Mode (A11y)", "Digital & Literacy Inclusion",
         "Ultra-minimalist, high-contrast interface designed for elderly, low-vision, and low-literacy citizens. Features massive text, audio narration, and one-tap emergency calling.",
         ["• Massive high-contrast UI", "• 1-Tap Web Speech narration", "• One-click 112 & 108 dials", "• Zero technical confusion"]),
        ("🏛️ Municipal Command", "GHMC Operational Console",
         "Empowers disaster commissioners and city engineers with real-time situational awareness: high-risk ward maps, exposed citizen counts, shelter occupancies, and field reports.",
         ["• Real-time ward severity map", "• 342,000+ citizens tracked", "• Live shelter occupancy rates", "• Choked nala dispatch feed"]),
        ("📊 Simulation & SitReps", "Preparedness & Logistics",
         "Interactive 'What-If' rainfall scenario simulator allows pre-positioning of de-watering pumps and boats. Generates 1-click executive Situation Reports for leadership briefings.",
         ["• Drag-and-drop rain slider", "• Basin flood simulation", "• 1-Click print-ready SitReps", "• Rapid inter-agency sync"])
    ]

    cw6 = Inches(2.72)
    ch6 = Inches(3.85)
    for i, (atitle, asub, adesc, abts) in enumerate(apps):
        cx = Inches(0.9 + i * 2.92)
        cy = Inches(2.45)

        bx = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, cy, cw6, ch6)
        bx.fill.solid()
        bx.fill.fore_color.rgb = COLOR_INNER_FILL
        bx.line.color.rgb = COLOR_BORDER

        tb = s6.shapes.add_textbox(cx + Inches(0.12), cy + Inches(0.12), cw6 - Inches(0.24), ch6 - Inches(0.24))
        tf = tb.text_frame
        tf.word_wrap = True

        pt = tf.paragraphs[0]
        pt.text = atitle
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12.5)
        pt.font.bold = True
        pt.font.color.rgb = COLOR_TITLE

        ps = tf.add_paragraph()
        ps.text = asub.upper()
        ps.font.name = FONT_BODY
        ps.font.size = Pt(9.5)
        ps.font.bold = True
        ps.font.color.rgb = COLOR_TEAL
        ps.space_after = Pt(6)

        pd = tf.add_paragraph()
        pd.text = adesc
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10)
        pd.font.color.rgb = COLOR_BODY
        pd.space_after = Pt(8)

        for b in abts:
            pb = tf.add_paragraph()
            pb.text = b
            pb.font.name = FONT_BODY
            pb.font.size = Pt(9.5)
            pb.font.color.rgb = RGBColor(51, 65, 85)

    nt6 = s6.shapes.add_textbox(Inches(0.9), Inches(6.35), Inches(11.5), Inches(0.35))
    nt6.text_frame.paragraphs[0].text = "Real-World Deployment: Live pilot seeded with 22 vulnerable GHMC municipal wards in Hyderabad, India."
    nt6.text_frame.paragraphs[0].font.size = Pt(10)
    nt6.text_frame.paragraphs[0].font.color.rgb = COLOR_MUTED

    # ==================== SLIDE 7: FUTURE SCOPES ====================
    s7 = add_base_slide(prs, 7, 8, 6, "FUTURE SCOPES & ROADMAP")

    tb_s7 = s7.shapes.add_textbox(Inches(0.9), Inches(1.5), Inches(11.5), Inches(0.85))
    tf7 = tb_s7.text_frame
    tf7.word_wrap = True

    p1 = tf7.paragraphs[0]
    p1.text = "Hardware Telemetry, Smart Routing & Nationwide Scaling"
    p1.font.name = FONT_HEADING
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_TITLE
    p1.space_after = Pt(3)

    p2 = tf7.add_paragraph()
    p2.text = "Nirvana is architected as an extensible civic platform designed to scale from local pilot to nationwide disaster resilience infrastructure."
    p2.font.name = FONT_BODY
    p2.font.size = Pt(12.5)
    p2.font.color.rgb = COLOR_BODY

    # 4 Roadmap Pillars
    scopes = [
        ("📡 IoT Sensor Telemetry", "Phase 1: Real-Time Hardware",
         "Deployment of low-cost, solar-powered LoRaWAN ultrasonic water-level sensors in open storm nalas, major culverts, and vulnerable railway underpasses.",
         ["• Solar LoRaWAN sensors", "• Real-time water depth telemetry", "• Autonomous calibration", "• Low hardware cost (<$40)"]),
        ("🗺️ AI Evacuation Routing", "Phase 2: Smart Navigation",
         "Integration with OpenStreetMap topological graphs to calculate dynamic 'dry-foot' pedestrian and vehicular evacuation paths avoiding submerged streets.",
         ["• Graph-based pathfinding", "• Elevation-aware routing", "• Submerged road avoidance", "• Live obstacle re-routing"]),
        ("📶 Offline Mesh & CAP Alerts", "Phase 3: Resilient Comms",
         "Implementation of Bluetooth Low Energy (BLE) citizen mesh networking and integration with National Disaster Management CAP cell broadcasts during cellular outages.",
         ["• Peer-to-peer BLE mesh", "• Zero-internet relaying", "• Official CAP SMS broadcast", "• 100% last-mile penetration"]),
        ("🌐 Pan-India Onboarding", "Phase 4: Nationwide Scale",
         "Modular city-agnostic ingestion pipeline enabling any Indian municipality (e.g. Mumbai, Chennai, Bengaluru, Patna) to onboard within 48 hours via local DEM and ward GeoJSON.",
         ["• <48-Hour city onboarding", "• Copernicus DEM pipeline", "• Demographic fairness audits", "• Multi-city federation"])
    ]

    cw7 = Inches(2.72)
    ch7 = Inches(3.85)
    for i, (rtitle, rsub, rdesc, rbts) in enumerate(scopes):
        cx = Inches(0.9 + i * 2.92)
        cy = Inches(2.45)

        bx = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, cy, cw7, ch7)
        bx.fill.solid()
        bx.fill.fore_color.rgb = COLOR_INNER_FILL
        bx.line.color.rgb = COLOR_BORDER

        tb = s7.shapes.add_textbox(cx + Inches(0.12), cy + Inches(0.12), cw7 - Inches(0.24), ch7 - Inches(0.24))
        tf = tb.text_frame
        tf.word_wrap = True

        pt = tf.paragraphs[0]
        pt.text = rtitle
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12.5)
        pt.font.bold = True
        pt.font.color.rgb = COLOR_TITLE

        ps = tf.add_paragraph()
        ps.text = rsub.upper()
        ps.font.name = FONT_BODY
        ps.font.size = Pt(9.5)
        ps.font.bold = True
        ps.font.color.rgb = COLOR_TEAL
        ps.space_after = Pt(6)

        pd = tf.add_paragraph()
        pd.text = rdesc
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10)
        pd.font.color.rgb = COLOR_BODY
        pd.space_after = Pt(8)

        for b in rbts:
            pb = tf.add_paragraph()
            pb.text = b
            pb.font.name = FONT_BODY
            pb.font.size = Pt(9.5)
            pb.font.color.rgb = RGBColor(51, 65, 85)

    nt7 = s7.shapes.add_textbox(Inches(0.9), Inches(6.35), Inches(11.5), Inches(0.35))
    nt7.text_frame.paragraphs[0].text = "Target Impact: Expanding from Hyderabad pilot to protect 10+ flood-prone Indian metropolitan zones by 2027."
    nt7.text_frame.paragraphs[0].font.size = Pt(10)
    nt7.text_frame.paragraphs[0].font.color.rgb = COLOR_MUTED

    # ==================== SLIDE 8: TECH STACK ====================
    s8 = add_base_slide(prs, 8, 8, 7, "TECH STACK USED")

    tb_s8 = s8.shapes.add_textbox(Inches(0.9), Inches(1.5), Inches(11.5), Inches(0.85))
    tf8 = tb_s8.text_frame
    tf8.word_wrap = True

    p1 = tf8.paragraphs[0]
    p1.text = "Technology Stack & Tooling Architecture"
    p1.font.name = FONT_HEADING
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_TITLE
    p1.space_after = Pt(3)

    p2 = tf8.add_paragraph()
    p2.text = "Nirvana is built on a high-performance modern stack combining reactive frontends, asynchronous microservices, and explainable AI."
    p2.font.name = FONT_BODY
    p2.font.size = Pt(12.5)
    p2.font.color.rgb = COLOR_BODY

    # 4 Horizontal Stack Cards
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

    lw8 = Inches(11.45)
    lh8 = Inches(0.88)
    for i, (lname, ltech, lnotes) in enumerate(layers):
        cy = Inches(2.45 + i * 0.98)

        bx = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.9), cy, lw8, lh8)
        bx.fill.solid()
        bx.fill.fore_color.rgb = COLOR_INNER_FILL
        bx.line.color.rgb = COLOR_BORDER

        # Left blue stripe
        stripe = s8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.9), cy, Inches(0.08), lh8)
        stripe.fill.solid()
        stripe.fill.fore_color.rgb = COLOR_TEAL
        stripe.line.color.rgb = COLOR_TEAL

        tb = s8.shapes.add_textbox(Inches(1.15), cy + Inches(0.05), lw8 - Inches(0.35), lh8 - Inches(0.1))
        tf = tb.text_frame
        tf.word_wrap = True

        pt = tf.paragraphs[0]
        pt.text = lname
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(11.5)
        pt.font.bold = True
        pt.font.color.rgb = COLOR_TITLE

        ptch = tf.add_paragraph()
        ptch.text = ltech
        ptch.font.name = FONT_BODY
        ptch.font.size = Pt(10.5)
        ptch.font.bold = True
        ptch.font.color.rgb = COLOR_BLUE

        pn = tf.add_paragraph()
        pn.text = lnotes
        pn.font.name = FONT_BODY
        pn.font.size = Pt(9.5)
        pn.font.color.rgb = COLOR_BODY

    nt8 = s8.shapes.add_textbox(Inches(0.9), Inches(6.35), Inches(11.5), Inches(0.35))
    nt8.text_frame.paragraphs[0].text = "Architecture: 100% reproducible local and cloud deployment with zero proprietary vendor lock-in."
    nt8.text_frame.paragraphs[0].font.size = Pt(10)
    nt8.text_frame.paragraphs[0].font.color.rgb = COLOR_MUTED

    # Save
    prs.save(output_path)
    print(f"Native editable PPTX saved: {output_path}")

if __name__ == "__main__":
    pptx_out = os.path.join(BASE_DIR, "NIRVANA_AXION_Hackathon_2026.pptx")
    build_full_native_pptx(pptx_out)

    downloads_dir = "c:/Users/shaik/Downloads"
    if os.path.exists(downloads_dir):
        import shutil
        shutil.copy(pptx_out, os.path.join(downloads_dir, "NIRVANA_AXION_Hackathon_2026.pptx"))
        print("Copied native PPTX to Downloads.")
