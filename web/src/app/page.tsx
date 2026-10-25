'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  SupportedLanguage,
  UserPersona,
  Horizon,
  RiskLevel,
  WardFeature,
  Shelter,
  CitizenReport,
  AlertItem,
  MunicipalKPIs,
  WeatherData
} from '../types';
import {
  HYDERABAD_WARDS,
  INITIAL_SHELTERS,
  INITIAL_REPORTS,
  INITIAL_ALERTS,
  INITIAL_KPIS
} from '../lib/mock-data';
import { LANGUAGES, getTranslation } from '../lib/i18n';
import { fetchWeather } from '../lib/weather';
import dynamic from 'next/dynamic';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { DualRiskGauge } from '../components/DualRiskGauge';
import { RiskExplainer } from '../components/RiskExplainer';
import { SafetyChecklist } from '../components/SafetyChecklist';
import { ShelterLocator } from '../components/ShelterLocator';
import { CitizenReports } from '../components/CitizenReports';
import { SimpleModeView } from '../components/SimpleModeView';
import { MunicipalCommand } from '../components/MunicipalCommand';
import { SimulationBar } from '../components/SimulationBar';
import { WeatherWidget } from '../components/WeatherWidget';
import { OnboardingModal } from '../components/OnboardingModal';
import { TrustBar } from '../components/TrustBar';
import { OfflineBanner } from '../components/OfflineBanner';
import { MobileCitizenNav } from '../components/MobileCitizenNav';
import { SosModal } from '../components/SosModal';

import {
  Search,
  MapPin,
  Volume2,
  Shield,
  Sparkles,
  CheckCircle,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Compass
} from 'lucide-react';

// Dynamic client-side import for MapComponent to guarantee real WebGL rendering in browser
const MapComponent = dynamic(
  () => import('../components/MapComponent').then((mod) => mod.MapComponent),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-2xl bg-[#FBF7EF] border border-[#EADBCA] flex flex-col items-center justify-center p-8 text-center animate-pulse">
        <div className="w-12 h-12 rounded-full bg-[#E3F1F4] flex items-center justify-center text-[#1F7A8C] mb-3">
          <Compass className="w-6 h-6 animate-spin text-[#006070]" />
        </div>
        <h4 className="font-heading font-bold text-sm text-[#1c1b1a] mb-1">
          Initializing Real Geographic Map...
        </h4>
        <span className="text-xs text-[#6F6A60]">
          Loading streets, waterways, drainage topology, and verified safe havens
        </span>
      </div>
    )
  }
);

interface LocationErrorState {
  type: 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'insecure';
  message: string;
}

export default function Home() {
  // Application State
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [isCommandView, setIsCommandView] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [persona, setPersona] = useState<UserPersona>('low_lying');
  const [horizon, setHorizon] = useState<Horizon>('now');
  const [simulatedTimeStep, setSimulatedTimeStep] = useState(0);

  // Selected Location & Simulation
  const [selectedWardId, setSelectedWardId] = useState<string>('ward-72');
  const [searchQuery, setSearchQuery] = useState('');
  const [userGpsCoords, setUserGpsCoords] = useState<{ lat: number; lng: number; accuracy: number; label: string } | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [locationError, setLocationError] = useState<LocationErrorState | null>(null);
  const [rainfallRate, setRainfallRate] = useState<number>(0);
  const [temperatureC, setTemperatureC] = useState<number>(28);
  const [isScenarioActive, setIsScenarioActive] = useState(false);

  // Live Weather Intelligence State (Open-Meteo Provider)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Data Stores
  const [wardsData, setWardsData] = useState<WardFeature[]>(HYDERABAD_WARDS.features);
  const [shelters, setShelters] = useState<Shelter[]>(INITIAL_SHELTERS);
  const [reports, setReports] = useState<CitizenReport[]>(INITIAL_REPORTS);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [kpis, setKpis] = useState<MunicipalKPIs>(INITIAL_KPIS);

  // Active Ward Details
  const activeWard = wardsData.find(w => w.properties.ward_id === selectedWardId) || wardsData[0];
  const activeProps = activeWard.properties;

  // Approximate coordinate distance in km (Haversine Euclidean planar projection for Hyderabad)
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLat = (lat2 - lat1) * 111.0;
    const dLon = (lon2 - lon1) * 105.0;
    return Math.round(Math.sqrt(dLat * dLat + dLon * dLon) * 100) / 100;
  };

  // Get active ward centroid coordinates
  const wardCoords = activeWard.geometry?.coordinates?.[0] || [[78.42, 17.38]];
  const activeWardLng = wardCoords.reduce((acc, c) => acc + c[0], 0) / wardCoords.length;
  const activeWardLat = wardCoords.reduce((acc, c) => acc + c[1], 0) / wardCoords.length;

  // Target coordinates: user detected GPS prioritized, fallback to selected ward centroid
  const targetLat = userGpsCoords ? userGpsCoords.lat : activeWardLat;
  const targetLng = userGpsCoords ? userGpsCoords.lng : activeWardLng;
  const targetLocationLabel = userGpsCoords ? userGpsCoords.label : activeProps.name;

  // Dynamically calculate real distance & walking time from user GPS (or active ward) to every shelter
  const dynamicShelters = useMemo(() => {
    const originLat = userGpsCoords ? userGpsCoords.lat : activeWardLat;
    const originLng = userGpsCoords ? userGpsCoords.lng : activeWardLng;
    return shelters.map(s => {
      const dist = calculateDistanceKm(originLat, originLng, s.lat, s.lng);
      return {
        ...s,
        distance_km: dist,
        walking_mins: Math.max(2, Math.round(dist * 12))
      };
    }).sort((a, b) => a.distance_km - b.distance_km);
  }, [shelters, activeWardLat, activeWardLng, userGpsCoords]);

  // Synchronize Live Weather from Open-Meteo API
  const refreshWeather = async (force: boolean = false) => {
    setIsWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await fetchWeather(targetLat, targetLng, force);
      setWeatherData(data);
      setIsWeatherLoading(false);
      if (!isScenarioActive) {
        if (typeof data.current.temperature_c === 'number') {
          setTemperatureC(Math.round(data.current.temperature_c));
        }
        if (typeof data.current.precipitation_mm === 'number') {
          setRainfallRate(Math.round(data.current.precipitation_mm));
        }
      }
    } catch (e: any) {
      setIsWeatherLoading(false);
      setWeatherError('Unable to retrieve real-time weather from Open-Meteo. Please check connection and click Refresh.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadWeatherEffect = async () => {
      setIsWeatherLoading(true);
      setWeatherError(null);
      try {
        const data = await fetchWeather(targetLat, targetLng, false, controller.signal);
        if (isMounted) {
          setWeatherData(data);
          setIsWeatherLoading(false);
          if (!isScenarioActive) {
            if (typeof data.current.temperature_c === 'number') {
              setTemperatureC(Math.round(data.current.temperature_c));
            }
            if (typeof data.current.precipitation_mm === 'number') {
              setRainfallRate(Math.round(data.current.precipitation_mm));
            }
          }
        }
      } catch (err: any) {
        if (isMounted && err.name !== 'AbortError') {
          setIsWeatherLoading(false);
          setWeatherError('Unable to retrieve real-time weather from Open-Meteo. Please check connection and click Refresh.');
        }
      }
    };

    loadWeatherEffect();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [targetLat, targetLng]);

  // Live synchronization with FastAPI backend if running
  useEffect(() => {
    const controller = new AbortController();
    const syncBackend = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/v1/risk/wards?horizon=${horizon}&simulated_rain_mm=${rainfallRate}&simulated_temp_c=${temperatureC}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.features && data.features.length > 0) {
            setWardsData(data.features);
          }
        }
      } catch (e) {
        // Standalone offline mode: client-side engine computes formulas dynamically
      }
    };
    syncBackend();
    return () => controller.abort();
  }, [horizon, rainfallRate, temperatureC]);

  // Dynamically compute active risk levels based on simulation sliders and horizon
  const horizonMultiplier = horizon === '6h' ? 1.25 : horizon === '24h' ? 0.70 : horizon === '72h' ? 0.35 : 1.0;
  const dynamicFloodScore = Math.min(100, Math.max(5, Math.round(
    (activeProps.flood_score || 70) * (rainfallRate / 45) * horizonMultiplier
  )));
  const dynamicFloodLevel: RiskLevel = dynamicFloodScore >= 75 ? 'Severe' : dynamicFloodScore >= 55 ? 'High' : dynamicFloodScore >= 35 ? 'Moderate' : 'Low';
  const dynamicDepthCm = Math.round((dynamicFloodScore / 100) * 45);

  const dynamicHeatScore = Math.min(100, Math.max(5, Math.round(
    (activeProps.heat_score || 40) * (temperatureC / 34)
  )));
  const dynamicHeatLevel: RiskLevel = dynamicHeatScore >= 75 ? 'Severe' : dynamicHeatScore >= 55 ? 'High' : dynamicHeatScore >= 35 ? 'Moderate' : 'Low';

  // Scripted Demo Scenario: Heavy Rain in Hyderabad
  const handleRunHeavyRain = () => {
    setIsScenarioActive(true);
    setRainfallRate(85);
    setSimulatedTimeStep(2);
    setSelectedWardId('ward-72');

    const newAlert: AlertItem = {
      id: `alt-demo-${Date.now()}`,
      hazard: 'flood',
      severity: 'Severe',
      title: {
        en: 'FLASH DELUGE ALERT: Musi Basin & Nadeem Colony Breached',
        hi: 'आपातकालीन चेतावनी: नदीम कॉलोनी में जलभराव',
        te: 'తీవ్ర వరద హెచ్చరిక: నదీమ్ కాలనీ'
      },
      body: {
        en: 'Convective rainfall exceeded 85mm/hr. Shah Hatim Talab outflow overflowing. Evacuation underway to Nadeem Colony High School.',
        hi: '85 मिमी/घंटे की बारिश से नाला उफान पर। तुरंत सुरक्षित स्थान पर जाएं।',
        te: 'భారీ వర్షపాతం నమోదైనందున సమీప పునరావాస కేంద్రానికి తరలివెళ్లండి.'
      },
      target_wards: ['ward-72', 'ward-71', 'ward-55'],
      ward_names: ['Nadeem Colony', 'Karwan', 'Moosarambagh'],
      issued_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 6 * 3600000).toISOString(),
      channel: 'in_app',
      estimated_reach: 245000,
      delivery_status: 'sent',
      action_checklist: [
        'Move ground floor valuables to upper floor',
        'Turn off main electricity switch',
        'Proceed on foot to nearest verified high school shelter'
      ]
    };

    setAlerts(prev => [newAlert, ...prev]);
    setKpis(prev => ({
      ...prev,
      wards_at_severe: 8,
      people_in_high_risk: 520000,
      shelters_current_occupancy: 3450
    }));

    alert('SIMULATION TRIGGERED: 85mm/hr heavy convective deluge initialized across Hyderabad Musi basin. Wards updated to Severe, alerts broadcast live.');
  };

  // Scripted Demo Scenario: Heatwave in Old City
  const handleRunHeatwave = () => {
    setIsScenarioActive(true);
    setTemperatureC(44);
    setSelectedWardId('ward-48');
    alert('SIMULATION TRIGGERED: 44°C Extreme Heatwave scenario active for Charminar / Old City. Mandatory cooling center protocol activated.');
  };

  const handleResetScenario = () => {
    setIsScenarioActive(false);
    if (weatherData) {
      setRainfallRate(Math.round(weatherData.current.precipitation_mm || 0));
      setTemperatureC(Math.round(weatherData.current.temperature_c || 28));
    } else {
      setRainfallRate(0);
      setTemperatureC(28);
    }
    setSimulatedTimeStep(0);
    setSelectedWardId('ward-72');
    setAlerts(INITIAL_ALERTS);
    setKpis(INITIAL_KPIS);
  };

  const handleAddReport = (newRep: Partial<CitizenReport>) => {
    const reportLat = userGpsCoords ? userGpsCoords.lat : (activeWard.geometry?.coordinates?.[0]?.[0]?.[1] || 17.3820);
    const reportLng = userGpsCoords ? userGpsCoords.lng : (activeWard.geometry?.coordinates?.[0]?.[0]?.[0] || 78.4230);
    const reportObj: CitizenReport = {
      id: `rep-${Date.now()}`,
      ward_id: activeProps.ward_id,
      ward_name: activeProps.name,
      category: (newRep.category as any) || 'waterlogging',
      severity: newRep.severity || 'Severe',
      description: newRep.description || 'Water accumulation observed.',
      location_name: newRep.location_name || (userGpsCoords ? `Live GPS (${reportLat.toFixed(3)}°, ${reportLng.toFixed(3)}°)` : `${activeProps.name} Point`),
      lat: reportLat,
      lng: reportLng,
      photo_url: newRep.photo_url,
      has_audio_note: newRep.has_audio_note || false,
      timestamp: 'Just now',
      confirm_votes: 1,
      status: 'pending'
    };
    setReports(prev => [reportObj, ...prev]);
  };

  const handleConfirmReport = (reportId: string) => {
    setReports(prev =>
      prev.map(r => (r.id === reportId ? { ...r, confirm_votes: r.confirm_votes + 1 } : r))
    );
  };

  const handleTriageReport = (reportId: string, action: 'verify' | 'reject' | 'resolve') => {
    setReports(prev =>
      prev.map(r => (r.id === reportId ? { ...r, status: action === 'verify' ? 'verified' : action === 'resolve' ? 'resolved' : 'rejected' } : r))
    );
  };

  const wardOptions = wardsData.map(w => ({
    id: w.properties.ward_id,
    name: w.properties.name
  }));

  const handleSelectSearchedWard = (wardId: string) => {
    setSelectedWardId(wardId);
    setSearchQuery('');
    const el = document.getElementById('monitor-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  // Real Dynamic Browser Geolocation (GPS) with Two-Stage Fallback
  const handleUseRealGps = () => {
    if (typeof window === 'undefined' || !navigator || !('geolocation' in navigator)) {
      setLocationError({
        type: 'unsupported',
        message: 'Browser Geolocation is not supported in this environment. Please search for your locality or ward manually.'
      });
      return;
    }

    if (window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setLocationError({
        type: 'insecure',
        message: 'Browser Geolocation requires a secure HTTPS connection. Please access Nirvana via HTTPS or enter your locality in the search bar.'
      });
      return;
    }

    setIsLocatingGps(true);
    setLocationError(null);

    const onPositionSuccess = async (pos: GeolocationPosition) => {
      setIsLocatingGps(false);
      setLocationError(null);
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = Math.round(pos.coords.accuracy || 0);

      // Validate latitude and longitude bounds
      if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90 ||
          typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
        setLocationError({
          type: 'unavailable',
          message: 'Received invalid coordinates from the device. Please try again or select your ward manually.'
        });
        return;
      }

      // Map to closest ward in Hyderabad pilot database
      let nearestWard = wardsData[0];
      let minDistance = Infinity;

      wardsData.forEach(w => {
        const coords = w.geometry?.coordinates?.[0] || [[78.42, 17.38]];
        const cLng = coords.reduce((acc, p) => acc + p[0], 0) / coords.length;
        const cLat = coords.reduce((acc, p) => acc + p[1], 0) / coords.length;
        const d = Math.sqrt(((lat - cLat) * 111.0) ** 2 + ((lng - cLng) * 105.0) ** 2);
        if (d < minDistance) {
          minDistance = d;
          nearestWard = w;
        }
      });

      setSelectedWardId(nearestWard.properties.ward_id);
      const gpsLabel = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (±${accuracy}m)`;
      setUserGpsCoords({ lat, lng, accuracy, label: gpsLabel });
      setSearchQuery(`${nearestWard.properties.name} [GPS: ${lat.toFixed(3)}°, ${lng.toFixed(3)}°]`);

      // Query backend FastAPI dynamically for real coordinates
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/risk?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const liveData = await res.json();
          console.log('Live dynamic risk computed for coordinates:', liveData);
        }
      } catch (e) {
        // Offline / client-side mode
      }

      const el = document.getElementById('monitor-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    };

    // Stage 1: Try high accuracy (GPS sensor)
    navigator.geolocation.getCurrentPosition(
      onPositionSuccess,
      (err1) => {
        // If permission explicitly denied by user, do not retry; show informative guidance immediately
        if (err1.code === 1) { // PERMISSION_DENIED
          setIsLocatingGps(false);
          setLocationError({
            type: 'denied',
            message: 'Location access was denied. Please allow location permissions in your browser address bar/settings, or search for your locality below.'
          });
          return;
        }

        // On laptops/desktops without GPS chips, high accuracy times out or is unavailable.
        // Stage 2: Fall back to standard accuracy (Wi-Fi triangulation / network location)
        navigator.geolocation.getCurrentPosition(
          onPositionSuccess,
          (err2) => {
            setIsLocatingGps(false);
            if (err2.code === 1) {
              setLocationError({
                type: 'denied',
                message: 'Location permission was denied. Please enable location permissions or search for your locality manually.'
              });
            } else if (err2.code === 3) {
              setLocationError({
                type: 'timeout',
                message: 'Location acquisition timed out. Please check your network connection and click "Retry Detection", or type your locality below.'
              });
            } else {
              setLocationError({
                type: 'unavailable',
                message: 'Physical position is currently unavailable from your device. Please search for your locality or select a ward from the list.'
              });
            }
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  };

  // Dynamic Locality & Geocoding Search Resolver
  const handleSearchLocation = async (query: string) => {
    if (!query.trim()) return;

    // 1. Direct match in local wards database
    const directMatch = wardsData.find(w =>
      w.properties.name.toLowerCase().includes(query.toLowerCase()) ||
      w.properties.circle.toLowerCase().includes(query.toLowerCase()) ||
      w.properties.zone.toLowerCase().includes(query.toLowerCase())
    );

    if (directMatch) {
      handleSelectSearchedWard(directMatch.properties.ward_id);
      return;
    }

    // 2. Comprehensive Hyderabad localities directory
    const hyderabadLocalities: Record<string, { lat: number; lng: number; wardId: string; name: string }> = {
      'tolichowki': { lat: 17.4014, lng: 78.4118, wardId: 'ward-71', name: 'Karwan / Tolichowki' },
      'mehdipatnam': { lat: 17.3916, lng: 78.4402, wardId: 'ward-72', name: 'Mehdipatnam / Nadeem Colony' },
      'nadeem colony': { lat: 17.3820, lng: 78.4230, wardId: 'ward-72', name: 'Mehdipatnam / Nadeem Colony' },
      'charminar': { lat: 17.3616, lng: 78.4747, wardId: 'ward-48', name: 'Charminar / Ghansi Bazaar' },
      'old city': { lat: 17.3616, lng: 78.4747, wardId: 'ward-48', name: 'Charminar / Ghansi Bazaar' },
      'moosarambagh': { lat: 17.3730, lng: 78.5095, wardId: 'ward-55', name: 'Malakpet / Moosarambagh' },
      'malakpet': { lat: 17.3750, lng: 78.4980, wardId: 'ward-55', name: 'Malakpet / Moosarambagh' },
      'begumpet': { lat: 17.4440, lng: 78.4680, wardId: 'ward-8', name: 'Begumpet / Prakash Nagar' },
      'amberpet': { lat: 17.3980, lng: 78.5150, wardId: 'ward-62', name: 'Amberpet / Ali Cafe' },
      'chandrayangutta': { lat: 17.3200, lng: 78.4800, wardId: 'ward-44', name: 'Chandrayangutta / Al Jubail' },
      'al jubail': { lat: 17.3200, lng: 78.4800, wardId: 'ward-44', name: 'Chandrayangutta / Al Jubail' },
      'uppal': { lat: 17.4050, lng: 78.5580, wardId: 'ward-10', name: 'Uppal / Ramanthapur' },
      'ramanthapur': { lat: 17.3950, lng: 78.5350, wardId: 'ward-10', name: 'Uppal / Ramanthapur' },
      'khairatabad': { lat: 17.4120, lng: 78.4600, wardId: 'ward-91', name: 'Khairatabad / Somajiguda' },
      'somajiguda': { lat: 17.4200, lng: 78.4600, wardId: 'ward-91', name: 'Khairatabad / Somajiguda' },
      'banjara hills': { lat: 17.4156, lng: 78.4350, wardId: 'ward-91', name: 'Khairatabad / Somajiguda' },
      'jubilee hills': { lat: 17.4300, lng: 78.4080, wardId: 'ward-72', name: 'Mehdipatnam / Nadeem Colony' },
      'hitec city': { lat: 17.4435, lng: 78.3772, wardId: 'ward-8', name: 'Begumpet / Prakash Nagar' },
      'gachibowli': { lat: 17.4400, lng: 78.3489, wardId: 'ward-71', name: 'Karwan / Tolichowki' },
      'kukatpally': { lat: 17.4849, lng: 78.4138, wardId: 'ward-8', name: 'Begumpet / Prakash Nagar' },
      'secunderabad': { lat: 17.4399, lng: 78.4983, wardId: 'ward-8', name: 'Begumpet / Prakash Nagar' },
      'ameerpet': { lat: 17.4375, lng: 78.4482, wardId: 'ward-91', name: 'Khairatabad / Somajiguda' },
      'nampally': { lat: 17.3888, lng: 78.4728, wardId: 'ward-48', name: 'Charminar / Ghansi Bazaar' },
      'alwal': { lat: 17.5020, lng: 78.5110, wardId: 'ward-8', name: 'Begumpet / Prakash Nagar' },
      'malkajgiri': { lat: 17.4520, lng: 78.5320, wardId: 'ward-10', name: 'Uppal / Ramanthapur' },
      'dilsukhnagar': { lat: 17.3688, lng: 78.5247, wardId: 'ward-55', name: 'Malakpet / Moosarambagh' }
    };

    const qLower = query.toLowerCase().trim();
    for (const [key, loc] of Object.entries(hyderabadLocalities)) {
      if (qLower.includes(key)) {
        setSelectedWardId(loc.wardId);
        setUserGpsCoords({ lat: loc.lat, lng: loc.lng, accuracy: 25, label: `${loc.name} (${loc.lat.toFixed(4)}°, ${loc.lng.toFixed(4)}°)` });
        setSearchQuery(`${loc.name}`);
        const el = document.getElementById('monitor-section');
        el?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // 3. Online OpenStreetMap Geocoding Fallback
    try {
      const osmRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Hyderabad')}&limit=1`);
      if (osmRes.ok) {
        const osmData = await osmRes.json();
        if (osmData && osmData.length > 0) {
          const lat = parseFloat(osmData[0].lat);
          const lng = parseFloat(osmData[0].lon);

          let bestWard = wardsData[0];
          let minD = Infinity;
          wardsData.forEach(w => {
            const coords = w.geometry?.coordinates?.[0] || [[78.42, 17.38]];
            const cLng = coords.reduce((acc, p) => acc + p[0], 0) / coords.length;
            const cLat = coords.reduce((acc, p) => acc + p[1], 0) / coords.length;
            const d = Math.sqrt(((lat - cLat) * 111.0) ** 2 + ((lng - cLng) * 105.0) ** 2);
            if (d < minD) {
              minD = d;
              bestWard = w;
            }
          });

          setSelectedWardId(bestWard.properties.ward_id);
          const label = osmData[0].display_name.split(',')[0];
          setUserGpsCoords({ lat, lng, accuracy: 50, label: `${label} (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)` });
          setSearchQuery(label);
          const el = document.getElementById('monitor-section');
          el?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
    } catch (e) {
      // offline fallback
    }

    alert(`Could not pinpoint "${query}". Showing closest monitoring telemetry for ${activeProps.name}.`);
  };

  // Web Speech for Hero Banner localized
  const handleListenHero = () => {
    if ('speechSynthesis' in window) {
      let msg = '';
      let speechLocale = 'en-IN';

      const nearestShelterName = dynamicShelters[0]?.name || 'City Relief Centre';
      if (currentLang === 'te') {
        speechLocale = 'te-IN';
        msg = `నిర్వాణ వాతావరణ హెచ్చరిక. ${activeProps.name} పరిధిలో వరద ముప్పు ఎక్కువగా ఉంది. నీటి మట్టం దాదాపు ${dynamicDepthCm} సెంటీమీటర్లు చేరే అవకాశం ఉంది. సమీప పునరావాస కేంద్రం ${nearestShelterName}.`;
      } else if (currentLang === 'hi') {
        speechLocale = 'hi-IN';
        msg = `निर्वाणा जलवायु चेतावनी। ${activeProps.name} में बाढ़ का जोखिम अधिक है। अनुमानित जलभराव ${dynamicDepthCm} सेंटीमीटर है। निकटतम आश्रय ${nearestShelterName} है।`;
      } else if (currentLang === 'ta') {
        speechLocale = 'ta-IN';
        msg = `நிர்வாணா வானிலை எச்சரிக்கை. ${activeProps.name} பகுதியில் வெள்ள அபாயம் உள்ளது. எதிர்பார்க்கப்படும் நீர்மட்டம் ${dynamicDepthCm} சென்டிமீட்டர். அருகிலுள்ள முகாம் ${nearestShelterName}.`;
      } else {
        speechLocale = 'en-IN';
        msg = `Nirvana Hyperlocal Climate Advisory for Hyderabad. Active alert in ${activeProps.name}. Estimated flood depth is ${dynamicDepthCm} centimeters. Nearest relief shelter is ${nearestShelterName}.`;
      }

      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.lang = speechLocale;
      utterance.rate = 0.90;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech not supported.');
    }
  };

  // SIMPLE MODE VIEW TOGGLE
  if (isSimpleMode) {
    return (
      <SimpleModeView
        wardName={activeProps.name}
        floodLevel={dynamicFloodLevel}
        depthCm={dynamicDepthCm}
        nearestShelterName={dynamicShelters[0]?.name || 'City Relief Centre'}
        nearestShelterContact={dynamicShelters[0]?.contact || '112'}
        currentLang={currentLang}
        onExitSimpleMode={() => setIsSimpleMode(false)}
      />
    );
  }

  return (
    <div className="w-full bg-[#FBF7EF] min-h-screen relative font-body text-[#2B2A28]">
      {/* 0. OFFLINE STATUS BANNER */}
      <OfflineBanner lastUpdatedText="8 mins ago" />

      {/* 1. GLOBAL HEADER */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        isSimpleMode={isSimpleMode}
        onToggleSimpleMode={() => setIsSimpleMode(!isSimpleMode)}
        isCommandView={isCommandView}
        onToggleCommandView={() => setIsCommandView(!isCommandView)}
        onCheckStreetClick={() => {
          const el = document.getElementById('monitor-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onStaffLoginClick={() => setIsCommandView(true)}
      />

      {/* 2. MUNICIPAL COMMAND CENTER VIEW TOGGLE */}
      {isCommandView ? (
        <main className="w-full pt-32 pb-20 max-w-7xl mx-auto px-4 lg:px-8">
          <MunicipalCommand
            wards={wardsData}
            shelters={dynamicShelters}
            reports={reports}
            alerts={alerts}
            kpis={kpis}
            onSendAlert={(newAlt) => setAlerts(prev => [newAlt as any, ...prev])}
            onTriageReport={handleTriageReport}
          />
        </main>
      ) : (
        /* 3. CITIZEN RESILIENCE WEB APP */
        <main className="w-full pt-28">
          {/* 3.1 GLOBAL CIVIC TRUST BAR */}
          <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 pt-4 pb-2">
            <TrustBar
              currentLang={currentLang}
              confidenceScore={activeProps.confidence || 94}
              minutesAgo={6}
              onListen={handleListenHero}
              showSyntheticDisclaimer={true}
            />
          </section>

          {/* 3.2 HERO SECTION */}
          <section className="relative w-full pt-10 pb-14 bg-gradient-to-b from-[#FBF7EF] via-[#FBF7EF] to-[#F3EBDD]/40 border-b border-[#EADBCA]/60">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col items-center text-center">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDEBD3] text-[#914d00] text-xs font-bold uppercase tracking-wider mb-5 shadow-sm">
                <Shield className="w-4 h-4 text-[#EE7B30]" />
                <span>{getTranslation(currentLang, 'hero_badge')}</span>
              </div>

              {/* Multilingual Headline */}
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1c1b1a] max-w-4xl tracking-tight leading-tight mb-4">
                {getTranslation(currentLang, 'hero_headline_pre')}
                <span className="text-[#914d00] underline decoration-[#fc9430] decoration-4 underline-offset-8">
                  {getTranslation(currentLang, 'hero_headline_target')}
                </span>
                {getTranslation(currentLang, 'hero_headline_post')}
              </h1>

              <p className="text-sm sm:text-base text-[#6F6A60] max-w-3xl mb-8 leading-relaxed">
                {getTranslation(currentLang, 'hero_sub')}
              </p>

              {/* Geolocation Failure / User-Friendly Error Banner */}
              {locationError && (
                <div className="w-full max-w-2xl bg-[#FBE1DF] border border-[#D9453D]/40 rounded-2xl p-4 mb-4 text-left flex items-start gap-3 shadow-sm animate-fade-in">
                  <AlertTriangle className="w-5 h-5 text-[#D9453D] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#D9453D]">
                        {locationError.type === 'denied' ? 'Location Permission Denied' :
                         locationError.type === 'timeout' ? 'Location Request Timed Out' :
                         locationError.type === 'insecure' ? 'Insecure Context' : 'Location Unavailable'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setLocationError(null)}
                        className="text-xs text-[#6F6A60] hover:text-[#1c1b1a] px-1.5 py-0.5 rounded cursor-pointer"
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-[#1c1b1a] mt-1 mb-2">
                      {locationError.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleUseRealGps}
                        disabled={isLocatingGps}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9453D] hover:bg-[#b8322b] text-white text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLocatingGps ? 'animate-spin' : ''}`} />
                        <span>Retry Detection</span>
                      </button>
                      <span className="text-[11px] text-[#6F6A60]">or search your locality in the box below</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC SEARCH BOX & REAL GPS */}
              <div className="w-full max-w-2xl bg-white rounded-full p-2 pl-5 flex items-center shadow-level2 border border-[#EADBCA] mb-3">
                <Search className="w-5 h-5 text-[#6F6A60] shrink-0 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchLocation(searchQuery);
                    }
                  }}
                  placeholder="Enter street, locality or colony (e.g. Tolichowki, Charminar, Banjara Hills, Begumpet)..."
                  className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-[#1c1b1a] placeholder:text-[#6F6A60]/60"
                />
                <button
                  type="button"
                  onClick={handleUseRealGps}
                  disabled={isLocatingGps}
                  title="Detect your real GPS location via browser Geolocation API"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F3EBDD] hover:bg-[#FDEBD3] text-[#1c1b1a] text-xs font-semibold shrink-0 transition-colors mr-1 cursor-pointer disabled:opacity-75"
                >
                  <MapPin className={`w-3.5 h-3.5 text-[#006070] ${isLocatingGps ? 'animate-spin' : ''}`} />
                  <span>{isLocatingGps ? 'Acquiring GPS...' : getTranslation(currentLang, 'use_gps')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSearchLocation(searchQuery)}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#1F7A8C] text-white hover:bg-[#17606F] text-xs font-semibold shrink-0 transition-all cursor-pointer"
                >
                  {getTranslation(currentLang, 'inspect_btn')}
                </button>
              </div>

              {/* Live Location Status Indicator */}
              {userGpsCoords && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs bg-[#E6F5ED] text-[#4CAF7A] border border-[#4CAF7A]/30 mb-4 animate-fade-in">
                  <span className="w-2 h-2 rounded-full bg-[#4CAF7A] animate-ping"></span>
                  <span className="font-bold">Dynamic GPS Locked:</span>
                  <span>{userGpsCoords.label}</span>
                </div>
              )}

              {/* Dynamic Auto-suggest dropdown when typing */}
              {searchQuery.trim().length > 1 && (
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-level3 border border-[#EADBCA] p-2 mb-6 text-left text-xs divide-y divide-[#EADBCA]">
                  {wardsData
                    .filter(w =>
                      w.properties.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      w.properties.circle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      w.properties.zone.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(w => (
                      <div
                        key={w.properties.ward_id}
                        onClick={() => handleSelectSearchedWard(w.properties.ward_id)}
                        className="p-3 hover:bg-[#F3EBDD] cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-[#1c1b1a]">{w.properties.name}</span>
                          <span className="text-[11px] text-[#6F6A60] block">{w.properties.circle} • Zone: {w.properties.zone}</span>
                        </div>
                        <span className="text-xs font-bold text-[#006070] px-2 py-0.5 rounded bg-[#E3F1F4]">
                          Elev {w.properties.base_elevation_m}m
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {/* Quick Language Rail */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-[#6F6A60] mr-1">{getTranslation(currentLang, 'switch_lang_label')}</span>
                {LANGUAGES.slice(0, 6).map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setCurrentLang(lang.code)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                      currentLang === lang.code
                        ? 'bg-[#1F7A8C] text-white border-[#1F7A8C] shadow-sm'
                        : 'bg-white text-[#6F6A60] border-[#EADBCA] hover:bg-[#F3EBDD]'
                    }`}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>

            </div>
          </section>

          {/* 3.3 ACTIVE STREET TELEMETRY & GAUGES */}
          <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10" id="monitor-section">
            
            {/* LIVE WEATHER INTELLIGENCE WIDGET */}
            <WeatherWidget
              weather={weatherData}
              locationName={targetLocationLabel}
              isLoading={isWeatherLoading}
              error={weatherError}
              onRefresh={() => refreshWeather(true)}
              currentLang={currentLang}
            />

            {/* SIMULATION BAR */}
            <SimulationBar
              rainfallRate={rainfallRate}
              onRainfallChange={setRainfallRate}
              temperatureC={temperatureC}
              onTemperatureChange={setTemperatureC}
              onRunHeavyRainScenario={handleRunHeavyRain}
              onRunHeatwaveScenario={handleRunHeatwave}
              onResetScenario={handleResetScenario}
              isScenarioActive={isScenarioActive}
              currentLang={currentLang}
            />

            {/* WARD SELECTION PILL */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <MapPin className="w-5 h-5 text-[#1F7A8C]" />
                <h2 className="font-heading text-2xl font-bold text-[#1c1b1a]">
                  {activeProps.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-[#E3F1F4] text-[#006070]">
                  {activeProps.circle}
                </span>
                {userGpsCoords && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E6F5ED] text-[#4CAF7A] border border-[#4CAF7A]/30">
                    <span className="w-2 h-2 rounded-full bg-[#4CAF7A] animate-ping"></span>
                    <span>Live GPS: {userGpsCoords.label}</span>
                  </span>
                )}
              </div>

              {/* Onboarding trigger */}
              <button
                onClick={() => setOnboardingOpen(true)}
                className="text-xs font-semibold text-[#006070] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{getTranslation(currentLang, 'onboarding_settings_label')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* DUAL GAUGES */}
            <div className="mb-8">
              <DualRiskGauge
                floodScore={dynamicFloodScore}
                floodLevel={dynamicFloodLevel}
                floodDepthCm={dynamicDepthCm}
                heatScore={dynamicHeatScore}
                heatLevel={dynamicHeatLevel}
                heatTempC={temperatureC}
                heatIndexC={temperatureC + 4}
                horizon={horizon}
                onHorizonChange={setHorizon}
                confidence={activeProps.confidence || 94}
                currentLang={currentLang}
              />
            </div>

            {/* EXPLAINER & SAFETY CHECKLIST GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <RiskExplainer
                factors={activeProps.top_factors || []}
                wardName={activeProps.name}
                elevationM={activeProps.base_elevation_m}
                drainageHealth={activeProps.drainage_health}
                currentLang={currentLang}
                rainfallRate={rainfallRate}
                handM={activeProps.hand_m || 1.2}
                twi={activeProps.twi || 11.5}
                musiProximityKm={activeProps.musi_proximity_km || 1.6}
                imperviousFraction={activeProps.impervious_fraction || 0.8}
              />

              <SafetyChecklist
                wardName={activeProps.name}
                persona={persona}
                onPersonaChange={setPersona}
                onSafeClick={() => alert(currentLang === 'te' ? 'మీరు సురక్షితంగా ఉన్నారని వార్డ్ అధికారికి మరియు కుటుంబానికి సమాచారం చేరవేయబడింది.' : 'Welfare status updated: "I Am Safe" registered with GHMC Emergency Operations.')}
                onSosClick={() => setSosModalOpen(true)}
                currentLang={currentLang}
              />
            </div>

            {/* INTERACTIVE VECTOR MAP */}
            <div className="mb-12">
              <MapComponent
                wards={wardsData}
                shelters={dynamicShelters}
                reports={reports}
                selectedWardId={selectedWardId}
                onSelectWard={setSelectedWardId}
                rainfallRate={rainfallRate}
                simulatedTimeStep={simulatedTimeStep}
                onTimeStepChange={setSimulatedTimeStep}
                currentLang={currentLang}
                userLocation={userGpsCoords}
              />
            </div>

            {/* VERIFIED SHELTERS LOCATOR */}
            <div className="mb-12">
              <ShelterLocator
                shelters={dynamicShelters}
                onCallShelter={(phone) => (window.location.href = `tel:${phone}`)}
                currentLang={currentLang}
              />
            </div>

            {/* CITIZEN FIELD REPORTS FEED */}
            <div className="mb-12">
              <CitizenReports
                reports={reports}
                onSubmitReport={handleAddReport}
                onConfirmReport={handleConfirmReport}
                currentWardName={activeProps.name}
                currentLang={currentLang}
              />
            </div>

            {/* SCIENTIFIC TELEMETRY & TRANSPARENCY SECTION */}
            <section className="w-full bg-[#F3EBDD]/50 rounded-card p-8 border border-[#EADBCA] mt-16" id="telemetry-section">
              <div className="max-w-4xl mx-auto text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#006070]">
                  {getTranslation(currentLang, 'telemetry_tag')}
                </span>
                <h3 className="font-heading text-2xl font-bold text-[#1c1b1a] mt-1 mb-3">
                  {getTranslation(currentLang, 'telemetry_title')}
                </h3>
                <p className="text-xs text-[#6F6A60] leading-relaxed mb-6">
                  {getTranslation(currentLang, 'telemetry_desc')}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-[#EADBCA] text-left">
                    <span className="font-bold text-xs text-[#1c1b1a] block">{getTranslation(currentLang, 'radar_label')}</span>
                    <span className="text-[11px] text-[#6F6A60]">Begumpet S-Band</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#EADBCA] text-left">
                    <span className="font-bold text-xs text-[#1c1b1a] block">{getTranslation(currentLang, 'sar_label')}</span>
                    <span className="text-[11px] text-[#6F6A60]">Surface Water Extent</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#EADBCA] text-left">
                    <span className="font-bold text-xs text-[#1c1b1a] block">{getTranslation(currentLang, 'iot_label')}</span>
                    <span className="text-[11px] text-[#6F6A60]">42 Sensor Nodes</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#EADBCA] text-left">
                    <span className="font-bold text-xs text-[#1c1b1a] block">{getTranslation(currentLang, 'ground_truth_label')}</span>
                    <span className="text-[11px] text-[#6F6A60]">Human Verification</span>
                  </div>
                </div>
              </div>
            </section>

          </section>
        </main>
      )}

      {/* 4. FOOTER */}
      <Footer currentLang={currentLang} />

      {/* 5. ONBOARDING MODAL */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={(data) => {
          setCurrentLang(data.language);
          setSelectedWardId(data.wardId);
          setPersona(data.persona);
          alert(data.language === 'te' ? `ప్రాధాన్యతలు భద్రపరచబడ్డాయి! ${data.wardId} కొరకు తెలుగులో హెచ్చరికలు నమోదయ్యాయి.` : `Preferences saved! Alerts registered for ${data.wardId} in ${data.language}.`);
        }}
        wards={wardOptions}
      />

      {/* 6. MOBILE CITIZEN FLOATING NAV */}
      <MobileCitizenNav
        currentLang={currentLang}
        onOpenSos={() => setSosModalOpen(true)}
        onOpenProfile={() => setOnboardingOpen(true)}
      />

      {/* 7. SOS EMERGENCY MODAL */}
      <SosModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        currentLang={currentLang}
        nearestShelter={dynamicShelters[0] || null}
        userCoords={userGpsCoords}
        wardName={activeProps.name}
        onNavigateShelters={() => {
          const el = document.getElementById('verified-shelters');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onRequestHelp={() => {
          handleAddReport({
            category: 'waterlogging',
            severity: 'Severe',
            description: 'SOS BEACON: Urgent assistance requested for resident in flooded sector.'
          });
        }}
      />
    </div>
  );
}
