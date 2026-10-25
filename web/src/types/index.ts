export type HazardType = 'flood' | 'heat';
export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe';
export type Horizon = 'now' | '6h' | '24h' | '72h';

export type UserPersona = 'general' | 'outdoor_worker' | 'elderly' | 'low_lying' | 'informal_housing';

export type SupportedLanguage = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml' | 'mr' | 'bn' | 'ur';

export interface WardProperties {
  ward_id: string;
  ward_no: number;
  name: string;
  circle: string;
  zone: string;
  population: number;
  area_sqkm: number;
  base_elevation_m: number;
  slope_deg: number;
  twi: number;
  hand_m: number;
  drainage_density_km_sqkm: number;
  drainage_health: 'Clear' | 'Partially Blocked' | 'Blocked';
  drainage_capacity_score: number;
  musi_proximity_km: number;
  lake_overflow_risk: string;
  impervious_fraction: number;
  vulnerability_index: number;
  elderly_pct: number;
  outdoor_workers_pct: number;
  informal_housing_pct: number;
  pumps_stationed: number;
  active_shelters: number;
  primary_contact: string;
  // Dynamic risk attributes
  flood_score?: number;
  flood_level?: RiskLevel;
  flood_depth_cm?: number;
  heat_score?: number;
  heat_level?: RiskLevel;
  heat_temp_c?: number;
  heat_index_c?: number;
  confidence?: number;
  top_factors?: string[];
}

export interface WardFeature {
  type: 'Feature';
  id: string;
  properties: WardProperties;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface WardGeoJSON {
  type: 'FeatureCollection';
  features: WardFeature[];
}

export interface Shelter {
  id: string;
  name: string;
  ward_id: string;
  ward_name: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  contact: string;
  incharge_name: string;
  capacity: number;
  current_occupancy: number;
  facilities: {
    drinking_water: boolean;
    toilets: boolean;
    power_backup: boolean;
    medical_aid: boolean;
    wheelchair_accessible: boolean;
    women_safe_area: boolean;
    pet_friendly: boolean;
  };
  operating_hours: string;
  flood_safe_elevation: boolean;
  elevation_m: number;
  verification_status: 'Verified by municipality' | 'Verified by volunteer' | 'Community-submitted unverified';
  verified_at: string;
  verifier: string | null;
  distance_km?: number;
  walking_mins?: number;
}

export interface CitizenReport {
  id: string;
  ward_id: string;
  ward_name: string;
  category: 'waterlogging' | 'blocked_drain' | 'heat_stress' | 'power_cut';
  severity: RiskLevel;
  description: string;
  location_name: string;
  lat: number;
  lng: number;
  photo_url?: string;
  has_audio_note?: boolean;
  timestamp: string;
  confirm_votes: number;
  status: 'pending' | 'verified' | 'rejected' | 'resolved';
  verified_by?: string;
}

export interface AlertItem {
  id: string;
  hazard: HazardType;
  severity: RiskLevel;
  title: Record<string, string>;
  body: Record<string, string>;
  target_wards: string[];
  ward_names: string[];
  issued_at: string;
  valid_until: string;
  channel: 'in_app' | 'sms' | 'whatsapp' | 'loudspeaker';
  estimated_reach: number;
  delivery_status: 'sent' | 'pending_approval' | 'scheduled' | 'cancelled';
  requires_two_person_approval?: boolean;
  approved_by?: string[];
  action_checklist: string[];
}

export interface MunicipalKPIs {
  wards_at_severe: number;
  people_in_high_risk: number;
  shelters_open: number;
  shelters_total_capacity: number;
  shelters_current_occupancy: number;
  active_citizen_reports: number;
  alerts_dispatched_today: number;
  last_updated: string;
}
