---
name: NeighbourWatch Civic Climate System
colors:
  surface: '#fdf9f5'
  surface-dim: '#ddd9d6'
  surface-bright: '#fdf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3ef'
  surface-container: '#f1edea'
  surface-container-high: '#ece7e4'
  surface-container-highest: '#e6e2de'
  on-surface: '#1c1b1a'
  on-surface-variant: '#3f484b'
  inverse-surface: '#31302e'
  inverse-on-surface: '#f4f0ec'
  outline: '#6f797c'
  outline-variant: '#bec8cb'
  surface-tint: '#006879'
  primary: '#006070'
  on-primary: '#ffffff'
  primary-container: '#1f7a8c'
  on-primary-container: '#e3f8ff'
  inverse-primary: '#83d2e6'
  secondary: '#914d00'
  on-secondary: '#ffffff'
  secondary-container: '#fc9430'
  on-secondary-container: '#663500'
  tertiary: '#005b93'
  on-tertiary: '#ffffff'
  tertiary-container: '#0774b9'
  on-tertiary-container: '#eff5ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a9edff'
  primary-fixed-dim: '#83d2e6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5b'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#cfe4ff'
  tertiary-fixed-dim: '#9acbff'
  on-tertiary-fixed: '#001d34'
  on-tertiary-fixed-variant: '#004a79'
  background: '#fdf9f5'
  on-background: '#1c1b1a'
  surface-variant: '#e6e2de'
  surface-cream: '#FBF7EF'
  surface-white: '#FFFFFF'
  surface-sand: '#F3EBDD'
  ink-muted: '#6F6A60'
  teal-hover: '#17606F'
  teal-tint: '#E3F1F4'
  saffron-tint: '#FDEBD3'
  risk-low: '#4CAF7A'
  risk-low-bg: '#E6F5ED'
  risk-moderate: '#F2B134'
  risk-moderate-bg: '#FDF3D8'
  risk-high: '#EE7B30'
  risk-high-bg: '#FDE6D6'
  risk-severe: '#D9453D'
  risk-severe-bg: '#FBE1DF'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-medium:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Noto Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Noto Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  regional-body:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 1.5rem
  margin-sm: 1rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

### Personality & Emotional Tenor
This design system embodies a calm, protective, and hyper-local civic guardian. In contrast to fear-inducing, sensationalist disaster reporting, this interface serves as an unshakeable, clear-eyed community bulletin. The emotional response sought is reassurance, clarity, and urgent readiness without panic. The tone balances municipal authority with neighborhood warmth: human, grounded, deeply local, and universally accessible across generational and digital literacy divides.

### Visual Movement & Design Philosophy
The aesthetic fuses **Tactile / Neumorphic-lite Warmth** with modern **Civic Humanism**:
- **Light-Only Canvas:** The interface strictly rejects dark modes or stark black panels. The foundation utilizes warm cream and soft mineral whites, recreating the legible warmth of layered archival paper and civic public boards under natural daylight.
- **Floating Tactile Planes:** Surfaces float with gentle, warm drop shadows and subtle hairlines, providing tangible, friendly affordances.
- **Non-Alarmist Risk Visualization:** Semantic warnings are rendered in warm, desaturated, nature-grounded tones (coral red, warm amber, leafy green) paired with iconography and textual labels rather than pure stark hazard washes.
- **Total Accessibility & Dignity:** Built for broad equity—featuring multi-script typography accommodation, minimum 48px tactile touch boundaries, redundant audio cue affordances, and zero decorative visual noise.

## Colors

### Surface Hierarchy & Contrast Rules
- **Base Canvas (`#FBF7EF`):** The universal floor for all layouts. Interfaces never break to pure grayscale gray or near-black canvases.
- **Card & Component Surfaces (`#FFFFFF`):** High-clarity elevated white planes that sit atop the cream canvas, outlined by subtle sand borders.
- **Texture & Alternating Blocks (`#F3EBDD`):** Warm sand accent surfaces for status callouts, card dividers, and neutral skeleton foundations.
- **Text & Content Inks:** Primary text is strictly warm charcoal-brown (`#2B2A28`), preventing harsh optical vibration. Subordinate details, timestamps, and secondary captions take muted slate-umber (`#6F6A60`). Pure black (`#000000`) is explicitly prohibited.

### Hazard & Status Scale
Risk values must always be communicated as a dual-token pair (solid foreground glyph/label + soft pastel container tint) and must never rely solely on color:
- **Low Risk:** Foreground `#4CAF7A` on Background `#E6F5ED`
- **Moderate Risk:** Foreground `#F2B134` on Background `#FDF3D8`
- **High Risk:** Foreground `#EE7B30` on Background `#FDE6D6`
- **Severe Risk:** Foreground `#D9453D` on Background `#FBE1DF`

### Action & Municipal Provenance
- Primary navigational interactions, civic verification seals, and active control pills use calm teal (`#1F7A8C`).
- Emergency Help, instant reporting triggers, and heat-hazard indicators utilize saffron-orange (`#F28C28`).
- Water and hydrological risks utilize water blue (`#3A8FD6`).

## Typography

### Structural Hierarchy & Pairing
- **Headings (Plus Jakarta Sans):** Geometric, welcoming, and high in optical clarity. Used across hero indicators, key alert values, card headings, and modal titles.
- **Body & Numerical Readouts (Inter):** Highly legible, neutral workhorse. Applied to situational reports, step-by-step citizen guides, shelter capacities, and tabular sensor data. Body text maintains a firm minimum baseline of 16px to protect low-vision and senior accessibility.
- **Labels & Regional Multilingual Scripts (Noto Sans):** Assigned to system metadata, verification tags, and all non-Latin regional script layers (Devanagari, Tamil, Telugu, Bengali, Arabic/Urdu).

### Multi-Script Handling
For regional non-Latin scripts, always assign the `regional-body` token. This enforces an expanded line-height of `28px` on a `16px` font size to accommodate complex ascenders, descenders, and stacked diacritics without clipping.

## Layout & Spacing

### Grid Architecture
- **Desktop (>= 1024px):** 12-column grid, 1200px max content width for public informational pages. Dashboard consoles leverage full-bleed width with a persistent 280px left command panel. Gutters scale at 24px (`gutter`).
- **Tablet (768px - 1023px):** 8-column grid with 20px gutters. Collapsible drawers transition to slide-in sheets.
- **Mobile (< 768px):** 4-column layout with 16px margins (`margin-sm`) and gutters (`gutter-sm`). Content cards stretch edge-to-edge within margins.

### Touch Targets & Spatial Density
Every interactive element must provide a minimum physical tap target of 48px × 48px on mobile and touch devices. Internal component padding follows an 8px rhythmic multiplier, ensuring loose, uncluttered layouts that prevent panic-induced miss-taps during critical alerts.

## Elevation & Depth

### Neumorphic-Lite & Layered Planes
Elevation is rendered strictly without harsh drop shadows. Instead, it relies on soft, diffused ambient light and warm-toned borders:

- **Level 0 (Flat Ground):** Base page background `#FBF7EF`. No shadow.
- **Level 1 (Card Rest):** Background `#FFFFFF`, 1px solid border `#EADBCA` (subtle sand border). Shadow: `0 4px 16px -2px rgba(43, 42, 40, 0.05), 0 2px 6px -1px rgba(43, 42, 40, 0.03)`.
- **Level 2 (Interactive Hover / Focus):** Cards lift 4px to 6px (`transform: translateY(-4px) scale(1.015)`). Shadow expands to `0 12px 28px -4px rgba(43, 42, 40, 0.08), 0 4px 10px -2px rgba(43, 42, 40, 0.04)`.
- **Level 3 (Floating Command Panels / Modals):** Pure white or 70% white translucent glass (`rgba(255, 255, 255, 0.70)` with `backdrop-filter: blur(12px)`). Shadow: `0 20px 38px -6px rgba(43, 42, 40, 0.10), 0 8px 16px -4px rgba(43, 42, 40, 0.05)`.
- **Severe Hazard Indicator Elevation:** Elevated with a non-strobing, gentle ambient pulse (`box-shadow: 0 0 0 4px #FBE1DF, 0 8px 24px rgba(217, 69, 61, 0.12)`).

## Shapes

### Corner Radii Hierarchy
The design system establishes a welcoming, highly rounded geometry:
- **Base Components (Inputs, Small Toggles):** `8px` (`0.5rem`).
- **Cards, Drawers, Floating Sheets:** `20px` to `28px` (`rounded-xl` / `1.5rem` to `1.75rem`), yielding an organic, tactile paper plane appearance.
- **Pill Objects (`9999px`):** All interactive buttons, action pills, voice readout chips ("Listen" audio trigger), timeline step pills, and status tags use full-capsule pill radii.

### Border Strokes
Containers utilize a structural 1px hairline border in `#EADBCA` to maintain crisp boundary distinction between pure white cards and the underlying warm cream canvas.

## Components

### Buttons & Interactive Triggers
- **Primary Pill:** Background calm teal (`#1F7A8C`), text `#FFFFFF`, rounded pill (`9999px`), 16px/24px padding. Hover: `#17606F` with a soft directional nudge.
- **Emergency / SOS Pill:** Saffron-orange (`#F28C28`), high-contrast ink text or white text, subtle breathing glow.
- **Audio "Listen" Capsule:** Warm sand background (`#F3EBDD`) with teal icon and ink text, pill-shaped, incorporating a live volume wave glyph for universal literacy support.
- **Override Ghost Button:** White surface with a 1.5px high-alert coral-red border (`#D9453D`) and coral text.

### Risk Cards & Containers
- Cards feature 24px internal padding, 24px border radii, and a pure white background.
- At the top of each risk card, a dual-layer risk banner displays the paired semantic color container (e.g., `#FBE1DF` for Severe) containing a 2px-stroke rounded icon, bold hazard level label, and localized status.
- Cards react to cursor hover with a 4px rise and 1.5% scale.

### Chips & Filter Pills
- Horizontal scrollable row with pill borders (`9999px`).
- Default: `#FFFFFF` fill with 1px `#EADBCA` outline and muted ink label.
- Selected: Calm teal tint (`#E3F1F4`) fill with solid teal text and 1px teal border.

### Verification Badges
- Municipal Verified: Solid teal pill background with a white checkmark icon.
- Community Verified: Soft green tint (`#E6F5ED`) with green label (`#4CAF7A`).
- Unverified Citizen Signal: Soft sand background (`#F3EBDD`) with a charcoal-brown warning badge.

### Input Fields & Controls
- 52px height container, pure white surface, 12px corner radius, framed with 1.5px `#EADBCA`.
- Focus state: Outline transitions to calm teal (`#1F7A8C`) with a 3px soft tint ring (`#E3F1F4`).
- Checkboxes and radios are oversized (24px × 24px minimum) with high-contrast checkmarks.

### Timeline Scrubbers & Forecast Trackers
- Horizontal segmented pill groups (`Now`, `+6h`, `+24h`, `+72h`) resting inside a warm sand container (`#F3EBDD`).
- Selected index animates with a spring-physics sliding white capsule behind the active label.