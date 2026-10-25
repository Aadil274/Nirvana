'use client';

import React, { useState, useEffect } from 'react';
import {
  SupportedLanguage,
  UserPersona,
  Horizon,
  RiskLevel,
  WardFeature,
  Shelter,
  CitizenReport,
  AlertItem,
  MunicipalKPIs
} from '../types';
import {
  HYDERABAD_WARDS,
  INITIAL_SHELTERS,
  INITIAL_REPORTS,
  INITIAL_ALERTS,
  INITIAL_KPIS
} from '../lib/mock-data';
import { LANGUAGES, getTranslation } from '../lib/i18n';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { DualRiskGauge } from '../components/DualRiskGauge';
import { RiskExplainer } from '../components/RiskExplainer';
import { SafetyChecklist } from '../components/SafetyChecklist';
import { MapComponent } from '../components/MapComponent';
import { ShelterLocator } from '../components/ShelterLocator';
import { CitizenReports } from '../components/CitizenReports';
import { SimpleModeView } from '../components/SimpleModeView';
import { MunicipalCommand } from '../components/MunicipalCommand';
import { SimulationBar } from '../components/SimulationBar';
import { OnboardingModal } from '../components/OnboardingModal';

import {
  Search,
  MapPin,
  Volume2,
  AlertTriangle,
  Waves,
  Flame,
  Shield,
  Sparkles,
  Info,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  // Application State
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [isCommandView, setIsCommandView] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [persona, setPersona] = useState<UserPersona>('low_lying');
  const [horizon, setHorizon] = useState<Horizon>('now');
  const [simulatedTimeStep, setSimulatedTimeStep] = useState(0);

  // Selected Location & Simulation
  const [selectedWardId, setSelectedWardId] = useState<string>('ward-72');
  const [searchQuery, setSearchQuery] = useState('');
  const [rainfallRate, setRainfallRate] = useState<number>(45);
  const [temperatureC, setTemperatureC] = useState<number>(34);
  const [isScenarioActive, setIsScenarioActive] = useState(false);

  // Data Stores
  const [wardsData, setWardsData] = useState<WardFeature[]>(HYDERABAD_WARDS.features);
  const [shelters, setShelters] = useState<Shelter[]>(INITIAL_SHELTERS);
  const [reports, setReports] = useState<CitizenReport[]>(INITIAL_REPORTS);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [kpis, setKpis] = useState<MunicipalKPIs>(INITIAL_KPIS);

  // Active Ward Details
  const activeWard = wardsData.find(w => w.properties.ward_id === selectedWardId) || wardsData[0];
  const activeProps = activeWard.properties;

  // Dynamically compute active risk levels based on simulation sliders
  const dynamicFloodScore = Math.min(100, Math.round(
    (activeProps.flood_score || 70) * (rainfallRate / 45) * (horizon === '6h' ? 1.2 : horizon === '24h' ? 0.8 : 1.0)
  ));
  const dynamicFloodLevel: RiskLevel = dynamicFloodScore >= 75 ? 'Severe' : dynamicFloodScore >= 55 ? 'High' : dynamicFloodScore >= 35 ? 'Moderate' : 'Low';
  const dynamicDepthCm = Math.round((dynamicFloodScore / 100) * 45);

  const dynamicHeatScore = Math.min(100, Math.round(
    (activeProps.heat_score || 40) * (temperatureC / 34)
  ));
  const dynamicHeatLevel: RiskLevel = dynamicHeatScore >= 75 ? 'Severe' : dynamicHeatScore >= 55 ? 'High' : dynamicHeatScore >= 35 ? 'Moderate' : 'Low';

  // Scripted Demo Scenario: Heavy Rain in Hyderabad
  const handleRunHeavyRain = () => {
    setIsScenarioActive(true);
    setRainfallRate(85);
    setSimulatedTimeStep(2);
    setSelectedWardId('ward-72');

    // Add high-priority live emergency alert
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
    setSelectedWardId('ward-48'); // Charminar / Old City
    alert('SIMULATION TRIGGERED: 44°C Extreme Heatwave scenario active for Charminar / Old City. Mandatory cooling center protocol activated.');
  };

  const handleResetScenario = () => {
    setIsScenarioActive(false);
    setRainfallRate(45);
    setTemperatureC(34);
    setSimulatedTimeStep(0);
    setSelectedWardId('ward-72');
    setAlerts(INITIAL_ALERTS);
    setKpis(INITIAL_KPIS);
  };

  // Citizen Report Submission
  const handleAddReport = (newRep: Partial<CitizenReport>) => {
    const reportObj: CitizenReport = {
      id: `rep-${Date.now()}`,
      ward_id: activeProps.ward_id,
      ward_name: activeProps.name,
      category: (newRep.category as any) || 'waterlogging',
      severity: newRep.severity || 'Severe',
      description: newRep.description || 'Water accumulation observed.',
      location_name: newRep.location_name || `${activeProps.name} Point`,
      lat: activeWard.geometry?.coordinates?.[0]?.[0]?.[1] || 17.3820,
      lng: activeWard.geometry?.coordinates?.[0]?.[0]?.[0] || 78.4230,
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

  // Search filtering
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

  // Web Speech for Hero Banner
  const handleListenHero = () => {
    if ('speechSynthesis' in window) {
      const msg = `Nirvana Hyperlocal Climate Advisory for Hyderabad. Active alert in ${activeProps.name}. Estimated flood depth is ${dynamicDepthCm} centimeters. Nearest relief shelter is ${shelters[0].name}.`;
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 0.92;
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
        nearestShelterName={shelters[0].name}
        nearestShelterContact={shelters[0].contact}
        currentLang={currentLang}
        onExitSimpleMode={() => setIsSimpleMode(false)}
      />
    );
  }

  return (
    <div className="w-full bg-[#FBF7EF] min-h-screen relative font-body text-[#2B2A28]">
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
            shelters={shelters}
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
          <section className="w-full bg-white/95 backdrop-blur-md border-b border-[#EADBCA] shadow-sm">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F5ED] text-[#1c1b1a]">
                  <span className="w-2 h-2 rounded-full bg-[#4CAF7A] animate-ping"></span>
                  <span className="font-semibold text-[#006070]">{getTranslation(currentLang, 'updated_ago')}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E3F1F4] text-[#006070] font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-[#1F7A8C]" />
                  <span>{getTranslation(currentLang, 'high_confidence')}</span>
                </div>
                <span className="hidden xl:inline text-[#6F6A60]">
                  {getTranslation(currentLang, 'advisory_disclaimer')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleListenHero}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3EBDD] hover:bg-[#FDEBD3] text-[#1c1b1a] font-semibold transition-all shadow-sm cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-[#006070]" />
                  <span>🔊 {getTranslation(currentLang, 'listen_btn')}</span>
                </button>
                <div className="hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E6F5ED] text-[#4CAF7A] font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{getTranslation(currentLang, 'offline_ready')}</span>
                </div>
              </div>
            </div>
          </section>

          {/* 3.2 HERO SECTION */}
          <section className="relative w-full pt-10 pb-14 bg-gradient-to-b from-[#FBF7EF] via-[#FBF7EF] to-[#F3EBDD]/40 border-b border-[#EADBCA]/60">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col items-center text-center">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDEBD3] text-[#914d00] text-xs font-bold uppercase tracking-wider mb-5 shadow-sm">
                <Shield className="w-4 h-4 text-[#EE7B30]" />
                <span>Hyperlocal Street-Level Climate Intelligence</span>
              </div>

              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1c1b1a] max-w-4xl tracking-tight leading-tight mb-4">
                Know what’s coming to <span className="text-[#914d00] underline decoration-[#fc9430] decoration-4 underline-offset-8">your street</span>, before it arrives.
              </h1>

              <p className="text-sm sm:text-base text-[#6F6A60] max-w-3xl mb-8 leading-relaxed">
                {getTranslation(currentLang, 'hero_sub')}
              </p>

              {/* SEARCH BOX & GPS */}
              <div className="w-full max-w-2xl bg-white rounded-full p-2 pl-5 flex items-center shadow-level2 border border-[#EADBCA] mb-6">
                <Search className="w-5 h-5 text-[#6F6A60] shrink-0 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter colony or ward (e.g. Nadeem Colony, Tolichowki, Moosarambagh, Begumpet)..."
                  className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-[#1c1b1a] placeholder:text-[#6F6A60]/60"
                />
                <button
                  onClick={() => {
                    setSelectedWardId('ward-72');
                    alert('GPS Located: Ward 72 (Mehdipatnam / Nadeem Colony) identified with 5m accuracy.');
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F3EBDD] hover:bg-[#FDEBD3] text-[#1c1b1a] text-xs font-semibold shrink-0 transition-colors mr-1 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#006070]" />
                  <span>{getTranslation(currentLang, 'use_gps')}</span>
                </button>
                <button
                  onClick={() => {
                    const found = wardsData.find(w => w.properties.name.toLowerCase().includes(searchQuery.toLowerCase()));
                    if (found) {
                      handleSelectSearchedWard(found.properties.ward_id);
                    } else {
                      alert('Showing telemetry for ' + activeProps.name);
                    }
                  }}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#1F7A8C] text-white hover:bg-[#17606F] text-xs font-semibold shrink-0 transition-all cursor-pointer"
                >
                  Inspect
                </button>
              </div>

              {/* Auto-suggest dropdown when typing */}
              {searchQuery.trim().length > 1 && (
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-level3 border border-[#EADBCA] p-2 mb-6 text-left text-xs divide-y divide-[#EADBCA]">
                  {wardsData
                    .filter(w => w.properties.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(w => (
                      <div
                        key={w.properties.ward_id}
                        onClick={() => handleSelectSearchedWard(w.properties.ward_id)}
                        className="p-3 hover:bg-[#F3EBDD] cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-semibold">{w.properties.name}</span>
                        <span className="text-[11px] text-[#6F6A60]">{w.properties.circle} • Elevation {w.properties.base_elevation_m}m</span>
                      </div>
                    ))}
                </div>
              )}

              {/* Quick Language Rail */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-[#6F6A60] mr-1">Switch Language:</span>
                {LANGUAGES.slice(0, 5).map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setCurrentLang(lang.code)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                      currentLang === lang.code
                        ? 'bg-[#1F7A8C] text-white border-[#1F7A8C]'
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
            />

            {/* WARD SELECTION PILL */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#1F7A8C]" />
                <h2 className="font-heading text-2xl font-bold text-[#1c1b1a]">
                  {activeProps.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-[#E3F1F4] text-[#006070]">
                  {activeProps.circle}
                </span>
              </div>

              {/* Onboarding trigger */}
              <button
                onClick={() => setOnboardingOpen(true)}
                className="text-xs font-semibold text-[#006070] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Change notification settings &amp; profile</span>
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
              />
            </div>

            {/* EXPLAINER & SAFETY CHECKLIST GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <RiskExplainer
                factors={activeProps.top_factors || [
                  'Low basin natural elevation (498m)',
                  'Blocked culvert inlet',
                  'Heavy 55mm rain forecasted'
                ]}
                wardName={activeProps.name}
                elevationM={activeProps.base_elevation_m}
                drainageHealth={activeProps.drainage_health}
              />

              <SafetyChecklist
                wardName={activeProps.name}
                persona={persona}
                onPersonaChange={setPersona}
                onSafeClick={() => alert('Welfare status updated: "I Am Safe" registered with GHMC Emergency Operations and your emergency family contact.')}
                onSosClick={() => {
                  if (confirm('SOS ALERT: Direct emergency beacon will be sent to SDRF First Responders. Proceed to call 112?')) {
                    window.location.href = 'tel:112';
                  }
                }}
              />
            </div>

            {/* INTERACTIVE VECTOR MAP */}
            <div className="mb-12">
              <MapComponent
                wards={wardsData}
                shelters={shelters}
                reports={reports}
                selectedWardId={selectedWardId}
                onSelectWard={setSelectedWardId}
                rainfallRate={rainfallRate}
                simulatedTimeStep={simulatedTimeStep}
                onTimeStepChange={setSimulatedTimeStep}
              />
            </div>

            {/* VERIFIED SHELTERS LOCATOR */}
            <div className="mb-12">
              <ShelterLocator
                shelters={shelters}
                onCallShelter={(phone) => (window.location.href = `tel:${phone}`)}
              />
            </div>

            {/* CITIZEN FIELD REPORTS FEED */}
            <div className="mb-12">
              <CitizenReports
                reports={reports}
                onSubmitReport={handleAddReport}
                onConfirmReport={handleConfirmReport}
                currentWardName={activeProps.name}
              />
            </div>

            {/* SCIENTIFIC TELEMETRY & TRANSPARENCY SECTION */}
            <section className="w-full bg-[#F3EBDD]/50 rounded-card p-8 border border-[#EADBCA] mt-16" id="telemetry-section">
              <div className="max-w-4xl mx-auto text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#006070]">
                  MULTI-AGENCY TELEMETRY FABRIC &amp; OPEN DATA
                </span>
                <h3 className="font-heading text-2xl font-bold text-[#1c1b1a] mt-1 mb-3">
                  Validated against national meteorological &amp; state hydrological models
                </h3>
                <p className="text-xs text-[#6F6A60] leading-relaxed mb-6">
                  Nirvana continuously calibrates IMD Doppler radar data, Copernicus Sentinel SAR soil moisture, and municipal culvert IoT depth sensors against verified citizen observations to eliminate false alarms and maximize hyper-local precision.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-[#EADBCA] text-left">
                    <span className="font-bold text-xs text-[#1c1b1a] block">IMD Doppler Radar</span>
                    <span className="text-[11px] text-[#6F6A60]">Begumpet S-Band</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#EADBCA] text-left">
                    <span className="font-bold text-xs text-[#1c1b1a] block">Sentinel-1 SAR</span>
                    <span className="text-[11px] text-[#6F6A60]">Surface Water Extent</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#EADBCA] text-left">
                    <span className="font-bold text-xs text-[#1c1b1a] block">GHMC Culvert IoT</span>
                    <span className="text-[11px] text-[#6F6A60]">42 Sensor Nodes</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#EADBCA] text-left">
                    <span className="font-bold text-xs text-[#1c1b1a] block">Ground Truth</span>
                    <span className="text-[11px] text-[#6F6A60]">Human Verification</span>
                  </div>
                </div>
              </div>
            </section>

          </section>
        </main>
      )}

      {/* 4. FOOTER */}
      <Footer />

      {/* 5. ONBOARDING MODAL */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={(data) => {
          setCurrentLang(data.language);
          setSelectedWardId(data.wardId);
          setPersona(data.persona);
          alert(`Preferences saved! Alerts registered for ${data.wardId} in ${data.language}.`);
        }}
        wards={wardOptions}
      />
    </div>
  );
}
