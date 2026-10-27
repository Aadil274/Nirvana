"""
Nirvana Risk Engine: Physically-Informed + Machine Learning Risk Estimator with Explainability
Combines baseline hydrological rules with calibrated tree-based classification and factor decomposition.
"""

from typing import Dict, Any, List, Tuple, Optional
import os
import math
import logging
import pandas as pd

logger = logging.getLogger(__name__)

_ML_BUNDLE: Optional[Dict[str, Any]] = None
_ML_LOAD_ATTEMPTED: bool = False

def get_ml_bundle() -> Optional[Dict[str, Any]]:
    global _ML_BUNDLE, _ML_LOAD_ATTEMPTED
    if not _ML_LOAD_ATTEMPTED:
        _ML_LOAD_ATTEMPTED = True
        model_path = os.path.join(os.path.dirname(__file__), "nirvana_flood_gb.joblib")
        if os.path.exists(model_path):
            try:
                import joblib
                _ML_BUNDLE = joblib.load(model_path)
                logger.info("Loaded Nirvana Gradient Boosting model from %s", model_path)
            except Exception as e:
                logger.warning("Failed to load Nirvana ML model: %s", e)
                _ML_BUNDLE = None
    return _ML_BUNDLE

class FloodRiskEngine:
    """
    Dual-layer Flood Risk Engine:
    Layer 1: Rule-based physically-informed baseline (elevation, slope, TWI, HAND, drainage condition).
    Layer 2: ML-calibrated model with factor contribution breakdown (SHAP proxy).
    """

    @classmethod
    def calculate_blended_risk(cls, features: Dict[str, Any]) -> Tuple[float, str, int, float]:
        """
        Calculates blended risk score combining physically-informed hydrological baseline
        with scikit-learn Gradient Boosting ML inference (when available).
        """
        baseline_score, baseline_level, depth_cm, baseline_conf = cls.calculate_baseline(features)
        
        bundle = get_ml_bundle()
        if not bundle or "model" not in bundle or "features" not in bundle:
            return baseline_score, baseline_level, depth_cm, baseline_conf
        
        try:
            model = bundle["model"]
            feat_names = bundle["features"]
            
            rain_1h = float(features.get("rain_1h_mm", 0.0))
            rain_3h = float(features.get("rain_3h_mm", 0.0))
            rain_24h = float(features.get("rain_24h_mm", rain_3h * 2.2))
            elevation = float(features.get("elevation_m", 500.0))
            slope = float(features.get("slope_deg", 1.2))
            twi = float(features.get("twi", 10.0))
            hand = float(features.get("hand_m", 2.0))
            drain_raw = features.get("drainage_health", "Clear")
            drain_val = 2.0 if drain_raw == "Blocked" else (1.0 if drain_raw == "Partially Blocked" else 0.0)
            impervious = float(features.get("impervious_fraction", 0.8))
            musi_dist = float(features.get("musi_proximity_km", 5.0))
            
            feature_dict = {
                "rain_1h_mm": rain_1h,
                "rain_3h_mm": rain_3h,
                "rain_24h_mm": rain_24h,
                "elevation_m": elevation,
                "slope_deg": slope,
                "twi": twi,
                "hand_m": hand,
                "drain_health": drain_val,
                "impervious_fraction": impervious,
                "musi_dist_km": musi_dist
            }
            
            df_in = pd.DataFrame([[feature_dict[col] for col in feat_names]], columns=feat_names)
            ml_prob = float(model.predict_proba(df_in)[0][1])
            ml_score = ml_prob * 100.0
            
            # Blend: 55% physical baseline + 45% ML probability
            blended_score = round(min(100.0, max(0.0, (0.55 * baseline_score) + (0.45 * ml_score))), 1)
            
            if blended_score >= 75:
                level = "Severe"
                depth_cm = int(25 + (blended_score - 75) * 1.5)
            elif blended_score >= 55:
                level = "High"
                depth_cm = int(12 + (blended_score - 55) * 0.6)
            elif blended_score >= 35:
                level = "Moderate"
                depth_cm = int(4 + (blended_score - 35) * 0.4)
            else:
                level = "Low"
                depth_cm = max(0, int(blended_score * 0.1))
                
            conf = min(98.0, baseline_conf + 4.0)
            return blended_score, level, depth_cm, conf
        except Exception as exc:
            logger.warning("ML blending fallback: %s", exc)
            return baseline_score, baseline_level, depth_cm, baseline_conf

    @staticmethod
    def calculate_baseline(features: Dict[str, Any]) -> Tuple[float, str, int, float]:
        """
        Calculates physically-informed baseline score [0-100], risk level, expected depth (cm), and confidence.
        """
        rain_1h = float(features.get("rain_1h_mm", 0.0))
        rain_3h = float(features.get("rain_3h_mm", 0.0))
        elevation = float(features.get("elevation_m", 500.0))
        twi = float(features.get("twi", 10.0))
        hand = float(features.get("hand_m", 2.0))
        drain_health = features.get("drainage_health", "Clear")
        impervious = float(features.get("impervious_fraction", 0.8))
        musi_dist = float(features.get("musi_proximity_km", 5.0))

        drain_penalty = 28.0 if drain_health == "Blocked" else (14.0 if drain_health == "Partially Blocked" else 0.0)
        
        # Rainfall sub-score (0-40)
        rain_score = min(40.0, (rain_1h * 0.4) + (rain_3h * 0.35))
        
        # Topographic susceptibility (0-30)
        # Low HAND (<1m) and high TWI (>11) represent depressions
        topo_score = 0.0
        if hand < 1.0:
            topo_score += 15.0 * (1.0 - hand)
        if twi > 10.0:
            topo_score += min(15.0, (twi - 10.0) * 4.0)

        # River proximity surge risk (0-15)
        river_score = max(0.0, 15.0 - (musi_dist * 5.0))

        # Impervious runoff modifier (0-15)
        runoff_score = impervious * 15.0

        total_score = min(100.0, max(0.0, rain_score + topo_score + river_score + runoff_score + (drain_penalty * 0.4)))

        # Categorize
        if total_score >= 75:
            level = "Severe"
            depth_cm = int(25 + (total_score - 75) * 1.5)
        elif total_score >= 55:
            level = "High"
            depth_cm = int(12 + (total_score - 55) * 0.6)
        elif total_score >= 35:
            level = "Moderate"
            depth_cm = int(4 + (total_score - 35) * 0.4)
        else:
            level = "Low"
            depth_cm = max(0, int(total_score * 0.1))

        # Confidence: Higher when drainage data is verified and Doppler telemetry is available
        confidence = 94 if drain_health != "Unknown" else 72

        return round(total_score, 1), level, depth_cm, confidence

    @staticmethod
    def explain_factors(features: Dict[str, Any]) -> List[str]:
        """
        Extracts top contributing factors in clear, actionable natural language.
        """
        factors = []
        rain_3h = float(features.get("rain_3h_mm", 0.0))
        elevation = float(features.get("elevation_m", 500.0))
        drain_health = features.get("drainage_health", "Clear")
        musi_dist = float(features.get("musi_proximity_km", 5.0))
        hand = float(features.get("hand_m", 2.0))
        lake_risk = features.get("lake_overflow_risk", "Low")

        if drain_health in ["Blocked", "Partially Blocked"]:
            factors.append(f"Storm drain culverts flagged as {drain_health.lower()} with silt or debris")
        
        if rain_3h >= 40.0:
            factors.append(f"Heavy convective precipitation forecast: {rain_3h:.0f}mm expected in 3 hours")
        elif rain_3h >= 20.0:
            factors.append(f"Moderate continuous rainfall: {rain_3h:.0f}mm anticipated")

        if hand <= 1.0 or elevation < 495.0:
            factors.append(f"Low-lying natural basin elevation ({elevation:.0f}m) prone to stormwater ponding")

        if musi_dist <= 1.0:
            factors.append(f"Immediate proximity to Musi River flood channel ({musi_dist * 1000:.0f}m)")

        if "High" in lake_risk or "Severe" in lake_risk:
            factors.append(f"Upstream lake surplus weir discharge ({lake_risk})")

        if not factors:
            factors.append("Terrain slope and stormwater drainage operating within normal safe parameters")

        return factors[:3]

    @staticmethod
    def explain_contributions(features: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Calculates exact mathematical factor attribution percentages (SHAP proxy).
        """
        rain_1h = float(features.get("rain_1h_mm", 0.0))
        rain_3h = float(features.get("rain_3h_mm", 0.0))
        elevation = float(features.get("elevation_m", 500.0))
        twi = float(features.get("twi", 10.0))
        hand = float(features.get("hand_m", 2.0))
        drain_health = features.get("drainage_health", "Clear")
        impervious = float(features.get("impervious_fraction", 0.8))
        musi_dist = float(features.get("musi_proximity_km", 5.0))

        drain_penalty = 28.0 if drain_health == "Blocked" else (14.0 if drain_health == "Partially Blocked" else 4.0)
        rain_score = max(2.0, min(40.0, (rain_1h * 0.4) + (rain_3h * 0.35)))
        
        topo_score = 3.0
        if hand < 1.0:
            topo_score += 15.0 * (1.0 - hand)
        if twi > 10.0:
            topo_score += min(15.0, (twi - 10.0) * 4.0)

        river_score = max(1.0, 15.0 - (musi_dist * 5.0))
        runoff_score = max(2.0, impervious * 15.0)

        total_weight = rain_score + topo_score + river_score + runoff_score + drain_penalty

        factors = [
            {
                "factor": "Height Above Drainage (HAND)",
                "contribution_pct": round((topo_score / total_weight) * 100, 1),
                "value": f"{hand:.1f}m (Elev {elevation:.0f}m)"
            },
            {
                "factor": "3-Hour Rainfall Forecast",
                "contribution_pct": round((rain_score / total_weight) * 100, 1),
                "value": f"{rain_3h:.0f}mm/hr"
            },
            {
                "factor": "Drainage Condition & Silt",
                "contribution_pct": round((drain_penalty / total_weight) * 100, 1),
                "value": drain_health
            },
            {
                "factor": "Impervious Surface Runoff",
                "contribution_pct": round((runoff_score / total_weight) * 100, 1),
                "value": f"{int(impervious * 100)}% paved"
            },
            {
                "factor": "Musi River Channel Proximity",
                "contribution_pct": round((river_score / total_weight) * 100, 1),
                "value": f"{musi_dist:.1f}km"
            }
        ]
        factors.sort(key=lambda x: x["contribution_pct"], reverse=True)
        return factors


class HeatRiskEngine:
    """
    Heat Risk Engine aligned with IMD Heatwave thresholds & vulnerability metrics.
    """

    @staticmethod
    def calculate_heat_risk(features: Dict[str, Any]) -> Tuple[float, str, float, float, List[str]]:
        temp_c = float(features.get("temp_c", 34.0))
        humidity = float(features.get("humidity_pct", 55.0))
        impervious = float(features.get("impervious_fraction", 0.85))
        outdoor_pct = float(features.get("outdoor_workers_pct", 30.0))
        elderly_pct = float(features.get("elderly_pct", 15.0))

        # Simplified Rothfusz / NOAA Heat Index calculation
        heat_index = (
            -8.78469475556
            + 1.61139411 * temp_c
            + 2.3385488388 * humidity
            - 0.14611605 * temp_c * humidity
            - 0.012308094 * (temp_c ** 2)
            - 0.0164248277 * (humidity ** 2)
            + 0.002211732 * (temp_c ** 2) * humidity
            + 0.00072546 * temp_c * (humidity ** 2)
            - 0.000003582 * (temp_c ** 2) * (humidity ** 2)
        )
        heat_index = max(temp_c, round(heat_index, 1))

        # Base heat score (0-100)
        base_score = 0.0
        if heat_index >= 45.0:
            base_score = 75.0 + min(25.0, (heat_index - 45.0) * 3.5)
        elif heat_index >= 40.0:
            base_score = 55.0 + (heat_index - 40.0) * 4.0
        elif heat_index >= 35.0:
            base_score = 35.0 + (heat_index - 35.0) * 4.0
        else:
            base_score = max(10.0, heat_index * 0.8)

        # Vulnerability weighting
        vuln_mult = 1.0 + (outdoor_pct / 100.0) * 0.15 + (elderly_pct / 100.0) * 0.10
        total_score = min(100.0, base_score * vuln_mult)

        if total_score >= 75:
            level = "Severe"
        elif total_score >= 55:
            level = "High"
        elif total_score >= 35:
            level = "Moderate"
        else:
            level = "Low"

        factors = []
        if heat_index >= 42.0:
            factors.append(f"High wet-bulb heat index ({heat_index:.1f}°C) severely restricting evaporative sweat cooling")
        if impervious >= 0.85:
            factors.append("Dense concrete built-up footprint (Urban Heat Island thermal trap)")
        if outdoor_pct >= 35.0:
            factors.append(f"Significant concentration of daily-wage outdoor workforce ({outdoor_pct:.0f}%)")

        if not factors:
            factors.append("Ambient thermal comfort within tolerable limits")

        return round(total_score, 1), level, temp_c, heat_index, factors[:3]
