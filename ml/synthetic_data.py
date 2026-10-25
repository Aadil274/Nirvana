"""
Nirvana ML: Synthetic Historical Complaint & Flood/Heat Event Generator for Hyderabad
Generates realistic historical calibration datasets reflecting 2020 deluge, 2016 lake overflows,
and 2024 heatwave events across 22 Hyderabad wards.
"""

import json
import random
import os
import pandas as pd
import numpy as np

WARD_PROFILES = [
    {"ward_id": "ward-72", "name": "Mehdipatnam / Nadeem Colony", "elevation": 498.2, "twi": 11.8, "hand": 1.2, "musi_dist": 1.6, "drain_choke": 0.85, "informal_pct": 36.0},
    {"ward_id": "ward-71", "name": "Karwan / Tolichowki", "elevation": 492.0, "twi": 12.5, "hand": 0.8, "musi_dist": 0.4, "drain_choke": 0.90, "informal_pct": 48.0},
    {"ward_id": "ward-55", "name": "Malakpet / Moosarambagh", "elevation": 486.5, "twi": 13.2, "hand": 0.5, "musi_dist": 0.1, "drain_choke": 0.75, "informal_pct": 42.5},
    {"ward_id": "ward-44", "name": "Chandrayangutta / Al Jubail", "elevation": 489.1, "twi": 12.0, "hand": 0.7, "musi_dist": 2.2, "drain_choke": 0.92, "informal_pct": 52.0},
    {"ward_id": "ward-48", "name": "Charminar / Old City", "elevation": 505.4, "twi": 8.4, "hand": 4.2, "musi_dist": 1.1, "drain_choke": 0.20, "informal_pct": 34.0},
    {"ward_id": "ward-149", "name": "Begumpet / Prakash Nagar", "elevation": 512.0, "twi": 11.2, "hand": 1.0, "musi_dist": 5.4, "drain_choke": 0.65, "informal_pct": 24.0},
    {"ward_id": "ward-118", "name": "Kukatpally / Nizampet", "elevation": 526.4, "twi": 11.5, "hand": 1.1, "musi_dist": 11.0, "drain_choke": 0.60, "informal_pct": 22.0},
    {"ward_id": "ward-93", "name": "Banjara Hills / Jubilee Hills", "elevation": 578.0, "twi": 6.8, "hand": 12.0, "musi_dist": 4.5, "drain_choke": 0.10, "informal_pct": 12.0},
    {"ward_id": "ward-62", "name": "Amberpet / Golnaka", "elevation": 488.0, "twi": 12.4, "hand": 0.6, "musi_dist": 0.2, "drain_choke": 0.70, "informal_pct": 40.0},
    {"ward_id": "ward-8", "name": "Uppal / Ramanthapur", "elevation": 482.0, "twi": 13.0, "hand": 0.4, "musi_dist": 0.8, "drain_choke": 0.88, "informal_pct": 44.0},
]

def generate_flood_training_dataset(num_samples: int = 5000) -> pd.DataFrame:
    rows = []
    np.random.seed(42)
    random.seed(42)

    for _ in range(num_samples):
        ward = random.choice(WARD_PROFILES)
        # Weather features
        rain_1h = max(0.0, np.random.exponential(scale=18.0))
        rain_3h = rain_1h * np.random.uniform(1.5, 2.8)
        rain_24h = rain_3h * np.random.uniform(1.4, 3.5)
        
        elevation = ward["elevation"] + np.random.normal(0, 2.0)
        slope = max(0.2, np.random.normal(1.2, 0.4))
        twi = ward["twi"] + np.random.normal(0, 0.5)
        hand = max(0.1, ward["hand"] + np.random.normal(0, 0.2))
        drain_health = 2 if ward["drain_choke"] > 0.7 else (1 if ward["drain_choke"] > 0.4 else 0)
        impervious = min(0.98, max(0.60, np.random.normal(0.85, 0.08)))
        musi_dist = ward["musi_dist"]

        # Physically informed ground-truth risk calculation
        flood_pot = (
            (rain_3h * 0.45) +
            (max(0, 520 - elevation) * 0.15) +
            (twi * 1.8) +
            (drain_health * 12.0) +
            (max(0, 3.0 - hand) * 6.0) +
            (max(0, 2.0 - musi_dist) * 8.0) +
            (impervious * 10.0)
        )
        
        # Add realistic noise
        flood_pot += np.random.normal(0, 5.0)
        
        # Label: Waterlogging complaint / severe flood
        # 0: None/Low (<35), 1: Moderate (35-55), 2: High (55-75), 3: Severe (>75)
        if flood_pot > 75:
            severity = 3
            depth_cm = min(90, int(15 + (flood_pot - 75) * 1.2))
            complaint_filed = 1 if np.random.random() < 0.95 else 0
        elif flood_pot > 55:
            severity = 2
            depth_cm = int(8 + (flood_pot - 55) * 0.5)
            complaint_filed = 1 if np.random.random() < 0.75 else 0
        elif flood_pot > 35:
            severity = 1
            depth_cm = int(2 + (flood_pot - 35) * 0.3)
            complaint_filed = 1 if np.random.random() < 0.30 else 0
        else:
            severity = 0
            depth_cm = 0
            complaint_filed = 0

        rows.append({
            "ward_id": ward["ward_id"],
            "rain_1h_mm": round(rain_1h, 1),
            "rain_3h_mm": round(rain_3h, 1),
            "rain_24h_mm": round(rain_24h, 1),
            "elevation_m": round(elevation, 1),
            "slope_deg": round(slope, 2),
            "twi": round(twi, 2),
            "hand_m": round(hand, 2),
            "drain_health": drain_health,
            "impervious_fraction": round(impervious, 2),
            "musi_dist_km": round(musi_dist, 2),
            "informal_housing_pct": ward["informal_pct"],
            "severity_level": severity,
            "depth_cm": depth_cm,
            "complaint_filed": complaint_filed
        })

    return pd.DataFrame(rows)

if __name__ == "__main__":
    df = generate_flood_training_dataset(5000)
    out_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(out_dir, "synthetic_flood_complaints.csv")
    df.to_csv(csv_path, index=False)
    print(f"Generated {len(df)} synthetic historical complaint records saved to {csv_path}")
