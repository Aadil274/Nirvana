# Nirvana Model Card: Hyperlocal Flood & Heat Risk Scoring Model

## Model Details
- **Name:** Nirvana Gradient Boosting Flood & Heat Resilience Classifier (`nirvana_flood_gb.joblib`)
- **Version:** 1.0.0 (October 2026)
- **Model Type:** Blended Physically-Informed Rule Engine + Calibrated Gradient Boosting Decision Trees (scikit-learn)
- **Primary Task:** Street-level flood risk probability and depth classification, and vulnerability-weighted heat stress index estimation.
- **Pilot Geography:** Greater Hyderabad Municipal Corporation (GHMC), Telangana, India.

---

## Intended Use
- **Primary Users:** Urban residents, informal settlement dwellers, daily-wage outdoor workers, senior citizens, municipal disaster response teams (GHMC, SDRF, NDRF), and ward champions.
- **Intended Purpose:** Provide advisory hyperlocal early warnings (horizons: Now, +6h, +24h, +72h) to prompt proactive measures: moving valuables to higher ground, opening drainage sluices, pre-positioning municipal pumps, accessing cooling shelters, and early evacuation.
- **Out-of-Scope / Misuse:** This model is **strictly advisory** and does not supersede statutory evacuation orders issued by the India Meteorological Department (IMD), National Disaster Management Authority (NDMA), or Telangana State Disaster Management Authority (TGDMA).

---

## Model Inputs & Feature Attribution
The model fuses multi-source geospatial and meteorological telemetry:

| Feature Name | Description | Source / Methodology | Importance (SHAP) |
|---|---|---|---|
| `hand_m` | Height Above Nearest Drainage (m) | Copernicus DEM 30m / pysheds | **53.1%** |
| `rain_3h_mm` | 3-Hour Cumulative Forecast Rainfall | Open-Meteo API / IMD Radar | **18.5%** |
| `twi` | Topographic Wetness Index ($\ln(a / \tan \beta)$) | SRTM DEM Hydrological Processing | **12.8%** |
| `rain_1h_mm` | 1-Hour Convective Rainfall Rate | IMD Doppler / Automated Weather Stations | **8.3%** |
| `elevation_m` | Base Topographic Elevation (MSL) | SRTM DEM | **3.2%** |
| `musi_dist_km` | Euclidean Distance to Musi River | GHMC River Boundary Layer | **1.8%** |
| `rain_24h_mm` | Antecedent 24-Hour Precipitation | GPM IMERG / Ground Gauges | **1.2%** |
| `impervious_fraction` | Concrete / Built-up Surface Fraction | Sentinel-2 NDVI / GHSL | **0.8%** |
| `slope_deg` | Terrain Slope in Degrees | DEM Surface Analysis | **0.3%** |
| `drain_health` | Blocked / Partially Blocked / Clear | GHMC Culvert IoT & Citizen Ground Reports | Dynamic Modifier |

---

## Quantitative Evaluation Metrics

The model was calibrated on 6,000 synthetic ground-truth and historical events modeled on the October 2020 Musi Deluge, September 2016 lake breach events, and May 2024 heatwave:

- **ROC-AUC Score:** `0.9925`
- **Brier Calibration Score:** `0.0290` (indicating well-calibrated probabilistic confidence)
- **Precision (High/Severe Class):** `0.97`
- **Recall (High/Severe Class):** `0.98`
- **Overall Classification Accuracy:** `96.0%`

---

## Demographic Equity & Fairness Audit

### Disparity Check: Informal vs. Formal Settlements
Informal settlements (such as Nadeem Colony, Al Jubail Colony, and parts of Karwan) frequently face systemic under-reporting due to digital divides, while simultaneously experiencing lower natural drainage capacity.
- **True Positive Rate in Informal Settlements:** `1.000` (100% of severe inundations detected)
- **True Positive Rate in Formal Settlements:** `0.909`
- **Disparity Ratio (TPR Informal / TPR Formal):** `1.101`
- **Finding:** No under-prediction bias against informal settlements. The physical weighting of HAND (<1m) and TWI ensures vulnerable topographic depressions receive immediate severe alerts regardless of historical complaint density.

---

## Explainability (SHAP Proxy)
For every cell and ward, Nirvana returns a natural language explanation breakdown:
- e.g. *"Low basin elevation (498m) + 58mm rainfall in 3h + Shah Hatim culvert inlet blocked with debris."*
- Explanations are exposed via the `GET /api/v1/risk/explain?cell_id=...` endpoint and rendered directly on the citizen dashboard.

---

## Assumptions & Limitations
1. **Drainage Cleaning Velocity:** During flash downpours, floating debris can block an otherwise "Clear" drain within 20 minutes. Citizen ground reports serve as live feedback loops to update the drain condition factor in real-time.
2. **Offline Fallback:** If live Doppler or Open-Meteo APIs are unreachable, the model falls back to the deterministic rule-based baseline and serves cached risk maps with an explicit freshness warning banner.
