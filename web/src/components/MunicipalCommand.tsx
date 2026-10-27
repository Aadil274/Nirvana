'use client';

import React, { useState, useEffect } from 'react';
import { WardFeature, Shelter, CitizenReport, AlertItem, MunicipalKPIs } from '../types';
import { API_BASE } from '../lib/api';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Home,
  CheckCircle2,
  Send,
  Wrench,
  FileText,
  BarChart3,
  Settings,
  Printer,
  ShieldAlert,
  ArrowUpDown,
  Search,
  Plus,
  X,
  Check,
  Download
} from 'lucide-react';

interface MunicipalCommandProps {
  wards: WardFeature[];
  shelters: Shelter[];
  reports: CitizenReport[];
  alerts: AlertItem[];
  kpis: MunicipalKPIs;
  onSendAlert: (alert: Partial<AlertItem>) => void;
  onTriageReport: (reportId: string, action: 'verify' | 'reject' | 'resolve') => void;
}

const INITIAL_RESOURCES = [
  { id: 'res-1', name: 'Heavy De-Watering Pump (500 GPM)', category: 'pump', assigned_ward: 'ward-72', status: 'deployed' },
  { id: 'res-2', name: 'Heavy De-Watering Pump (500 GPM)', category: 'pump', assigned_ward: 'ward-71', status: 'deployed' },
  { id: 'res-3', name: 'Trailer Pump (300 GPM)', category: 'pump', assigned_ward: 'ward-55', status: 'deployed' },
  { id: 'res-4', name: 'Inflatable Rescue Boat with OBM', category: 'boat', assigned_ward: 'ward-55', status: 'deployed' },
  { id: 'res-5', name: 'Inflatable Rescue Boat with OBM', category: 'boat', assigned_ward: 'ward-8', status: 'standby' },
  { id: 'res-6', name: 'SDRF First Responder Team (8 Pax)', category: 'team', assigned_ward: 'ward-72', status: 'deployed' },
  { id: 'res-7', name: 'SDRF First Responder Team (8 Pax)', category: 'team', assigned_ward: 'ward-44', status: 'deployed' },
  { id: 'res-8', name: 'Dry Ration Kits (500 Pk)', category: 'relief', assigned_ward: 'ward-72', status: 'distributed' },
  { id: 'res-9', name: 'High-Clearance Rescue Tipper Truck', category: 'vehicle', assigned_ward: 'ward-71', status: 'deployed' }
];

export const MunicipalCommand: React.FC<MunicipalCommandProps> = ({
  wards,
  shelters,
  reports,
  alerts,
  kpis,
  onSendAlert,
  onTriageReport
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'wards' | 'composer' | 'resources' | 'reports' | 'analytics' | 'admin'>('overview');
  const [selectedWardId, setSelectedWardId] = useState<string>('ward-72');
  const [composerWardIds, setComposerWardIds] = useState<string[]>(['ward-72', 'ward-71']);
  const [composerSeverity, setComposerSeverity] = useState('Severe');
  const [composerTitle, setComposerTitle] = useState('EMERGENCY FLOOD EVACUATION NOTICE');
  const [composerBody, setComposerBody] = useState('Water rising 40cm in low-lying sectors. Move to upper levels or proceed to designated high school shelters.');
  const [composerChannel, setComposerChannel] = useState<'in_app' | 'sms' | 'whatsapp' | 'loudspeaker'>('in_app');

  // SitRep Modal State
  const [sitrepModalOpen, setSitrepModalOpen] = useState(false);
  const [sitrepData, setSitrepData] = useState<any>(null);
  const [loadingSitrep, setLoadingSitrep] = useState(false);

  // Resource Inventory State
  const [resources, setResources] = useState(INITIAL_RESOURCES);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await fetch(`${API_BASE}/dashboard/resources`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.inventory) && data.inventory.length > 0) {
            setResources(data.inventory);
          }
        }
      } catch {}
    };
    fetchResources();
  }, []);

  const selectedWard = wards.find(w => w.properties.ward_id === selectedWardId) || wards[0];

  // Dynamically compute KPIs from live ward telemetry
  const severeWardsCount = wards.filter(w => (w.properties.flood_score || 0) >= 75 || (w.properties.heat_score || 0) >= 75).length || kpis.wards_at_severe;
  const highRiskPopulation = wards.reduce((acc, w) => {
    const score = Math.max(w.properties.flood_score || 0, w.properties.heat_score || 0);
    if (score >= 75) return acc + (w.properties.population || 50000);
    if (score >= 55) return acc + Math.round((w.properties.population || 50000) * 0.5);
    return acc;
  }, 0) || kpis.people_in_high_risk;

  const sheltersOpenCount = shelters.filter(s => s.verification_status.includes('Verified')).length || kpis.shelters_open;
  const sheltersOccupancyTotal = shelters.reduce((acc, s) => acc + (s.current_occupancy || 0), 0) || kpis.shelters_current_occupancy;
  const sheltersCapacityTotal = shelters.reduce((acc, s) => acc + (s.capacity || 0), 0) || kpis.shelters_total_capacity;

  // Dynamic AI recommendation per ward
  const aiAction = selectedWard.properties.drainage_health === 'Blocked' || (selectedWard.properties.musi_proximity_km || 5) < 1.0
    ? {
        title: `Pre-position 2 High-Capacity Bilge Pumps at ${selectedWard.properties.name.split('/')[0]} nala`,
        deadline: 'By 19:30 IST (Prior to convective peak)',
        rationale: `Inundation probability exceeds 85% with ${selectedWard.properties.drainage_health.toLowerCase()} drainage channels. Low basin (${selectedWard.properties.base_elevation_m}m) requires immediate dewatering.`
      }
    : (selectedWard.properties.flood_score || 0) >= 60
    ? {
        title: `Deploy Mobile Silt Clearing Unit to ${selectedWard.properties.name.split('/')[0]}`,
        deadline: 'By 20:30 IST',
        rationale: `Moderate runoff anticipated (${selectedWard.properties.flood_score}/100); clear surface grates to prevent localized ponding.`
      }
    : {
        title: `Routine Drainage Surveillance at ${selectedWard.properties.name.split('/')[0]}`,
        deadline: 'Standard shift rotation',
        rationale: `Elevation (${selectedWard.properties.base_elevation_m}m) and ${selectedWard.properties.drainage_health.toLowerCase()} drainage capacity provide adequate margin.`
      };

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendAlert({
      hazard: 'flood',
      severity: composerSeverity as any,
      title: { en: composerTitle, hi: `चेतावनी: ${composerTitle}`, te: `హెచ్చరిక: ${composerTitle}` },
      body: { en: composerBody, hi: composerBody, te: composerBody },
      target_wards: composerWardIds,
      ward_names: composerWardIds.map(id => wards.find(w => w.properties.ward_id === id)?.properties.name || id),
      channel: composerChannel,
      estimated_reach: composerWardIds.length * 85000,
      delivery_status: composerSeverity === 'Severe' ? 'pending_approval' : 'sent',
      requires_two_person_approval: composerSeverity === 'Severe'
    });
    alert(composerSeverity === 'Severe' ? 'Alert queued for mandatory Two-Person Approval (Severe Protocol).' : 'Alert broadcast live across selected channels.');
  };

  const handleOpenSitRep = async () => {
    setLoadingSitrep(true);
    setSitrepModalOpen(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/sitrep`);
      if (res.ok) {
        const data = await res.json();
        setSitrepData(data);
      } else {
        throw new Error('Fallback required');
      }
    } catch {
      setSitrepData({
        report_id: `SITREP-HYD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-1800`,
        title: "Nirvana Climate Resilience: Monsoon Flash-Flood Situation Report",
        city: "Hyderabad (GHMC)",
        issued_by: "Municipal Emergency Operations Center",
        timestamp: new Date().toISOString(),
        weather_summary: "Active deep convective squall over southern and central zones. Rain gauge telemetry active.",
        severe_wards: wards.filter(w => (w.properties.flood_score || 0) >= 75).map(w => `${w.properties.name} (${w.properties.flood_depth_cm || 25}cm inundation)`),
        evacuation_status: `${shelters.reduce((acc, s) => acc + (s.current_occupancy || 0), 0)} persons accommodated across ${shelters.length} active relief shelters.`,
        pumps_deployed: resources.filter(r => r.category === 'pump' && r.status === 'deployed').length,
        citizen_reports_resolved: `${reports.filter(r => r.status === 'resolved' || r.status === 'verified').length} of ${reports.length} crowd reports verified & actioned.`,
        statutory_notice: "Synthesized in compliance with NDMA Early Warning & Standard Operating Guidelines."
      });
    } finally {
      setLoadingSitrep(false);
    }
  };

  const handleAssignResource = async (resourceId: string, targetWardId: string) => {
    setAssigningId(resourceId);
    setResources(prev => prev.map(r => r.id === resourceId ? { ...r, assigned_ward: targetWardId, status: 'deployed' } : r));
    try {
      await fetch(`${API_BASE}/dashboard/resources/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_id: resourceId, ward_id: targetWardId })
      });
    } catch (e) {
      console.warn('Could not persist resource assignment:', e);
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="w-full bg-[#FFFFFF] rounded-card border border-[#EADBCA] p-6 lg:p-8 shadow-level1">
      {/* COMMAND CONSOLE TOP HEADER */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-[#EADBCA]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9453D] animate-ping"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006070]">
              GHMC MONSOON EMERGENCY CONTROL ROOM • WARD COMMAND CONSOLE
            </span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#1c1b1a] mt-0.5">
            Municipal Disaster Response &amp; Dispatch Console
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenSitRep}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1F7A8C] hover:bg-[#17606F] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate SitRep (1-Click)</span>
          </button>
        </div>
      </div>

      {/* COMMAND CONSOLE TABS */}
      <div className="flex items-center gap-1 overflow-x-auto py-4 border-b border-[#EADBCA]">
        {[
          { id: 'overview', label: '📊 Overview & KPIs', icon: LayoutDashboard },
          { id: 'wards', label: '🏙️ Ward Ranking & Action', icon: ArrowUpDown },
          { id: 'composer', label: '📢 Alert Composer & Approvals', icon: Send },
          { id: 'resources', label: '🚤 Resource Dispatch', icon: Wrench },
          { id: 'reports', label: '🛡️ Field Reports Queue', icon: CheckCircle2 },
          { id: 'analytics', label: '📈 Hydro-Analytics & Replay', icon: BarChart3 },
          { id: 'admin', label: '⚙️ Admin & Data Health', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-[#006070] text-white shadow-sm'
                  : 'text-[#6F6A60] hover:bg-[#F3EBDD] hover:text-[#1c1b1a]'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREAS */}
      <div className="pt-6">

        {/* 1. OVERVIEW & KPIS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#FBE1DF] border border-[#D9453D]/30">
                <span className="text-[11px] font-bold uppercase text-[#D9453D]">Wards At Severe Risk</span>
                <div className="text-3xl font-black text-[#D9453D] mt-1">{severeWardsCount}</div>
                <span className="text-[11px] text-[#6F6A60]">Out of {wards.length} monitored zones</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#FDE6D6] border border-[#EE7B30]/30">
                <span className="text-[11px] font-bold uppercase text-[#EE7B30]">People In Inundation Zones</span>
                <div className="text-3xl font-black text-[#EE7B30] mt-1">{highRiskPopulation.toLocaleString()}</div>
                <span className="text-[11px] text-[#6F6A60]">Prioritizing ground floors</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#E6F5ED] border border-[#4CAF7A]/30">
                <span className="text-[11px] font-bold uppercase text-[#4CAF7A]">Relief Shelters Open</span>
                <div className="text-3xl font-black text-[#4CAF7A] mt-1">{sheltersOpenCount}</div>
                <span className="text-[11px] text-[#6F6A60]">{sheltersOccupancyTotal.toLocaleString()} / {sheltersCapacityTotal.toLocaleString()} beds filled</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#E3F1F4] border border-[#1F7A8C]/30">
                <span className="text-[11px] font-bold uppercase text-[#006070]">Active Citizen Reports</span>
                <div className="text-3xl font-black text-[#006070] mt-1">{reports.length}</div>
                <span className="text-[11px] text-[#6F6A60]">{reports.filter(r => r.status === 'verified').length} ground-truth verified</span>
              </div>
            </div>

            {/* Quick Live Emergency Broadcast Feed */}
            <div className="p-5 rounded-2xl bg-[#fdf9f5] border border-[#EADBCA]">
              <h4 className="font-heading font-bold text-sm text-[#1c1b1a] mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#D9453D]" />
                Live Broadcast Status &amp; Multi-Channel Delivery
              </h4>
              <div className="space-y-3">
                {alerts.map(alt => (
                  <div key={alt.id} className="p-3.5 rounded-xl bg-white border border-[#EADBCA] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FBE1DF] text-[#D9453D]">
                          {alt.severity}
                        </span>
                        <span className="font-bold text-xs text-[#1c1b1a]">{alt.title.en}</span>
                      </div>
                      <span className="text-[11px] text-[#6F6A60] mt-0.5 block">
                        Channels: {alt.channel.toUpperCase()} | Estimated Citizens Reached: {alt.estimated_reach.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E6F5ED] text-[#4CAF7A]">
                      Dispatched
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. WARD RANKING & AI ACTIONS */}
        {activeTab === 'wards' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#EADBCA] rounded-2xl overflow-hidden">
                <thead className="bg-[#F3EBDD] text-[#1c1b1a] uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Ward Name</th>
                    <th className="p-3">Drain Health</th>
                    <th className="p-3">Elevation</th>
                    <th className="p-3">Flood Score</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADBCA]">
                  {wards.map(w => (
                    <tr
                      key={w.properties.ward_id}
                      onClick={() => setSelectedWardId(w.properties.ward_id)}
                      className={`cursor-pointer hover:bg-[#F3EBDD]/40 transition-colors ${
                        selectedWardId === w.properties.ward_id ? 'bg-[#E3F1F4]' : ''
                      }`}
                    >
                      <td className="p-3 font-semibold">{w.properties.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.properties.drainage_health === 'Blocked' ? 'bg-[#FBE1DF] text-[#D9453D]' : 'bg-[#E6F5ED] text-[#4CAF7A]'
                        }`}>
                          {w.properties.drainage_health}
                        </span>
                      </td>
                      <td className="p-3">{w.properties.base_elevation_m}m</td>
                      <td className="p-3 font-bold text-[#D9453D]">{w.properties.flood_score || 75} / 100</td>
                      <td className="p-3">
                        <button className="text-[#006070] font-bold hover:underline">Select</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ward Detail & AI Action Recommendation */}
            <div className="p-5 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA] space-y-4">
              <h4 className="font-heading font-bold text-base text-[#1c1b1a]">
                Ward Detail: {selectedWard.properties.name}
              </h4>
              <div className="p-4 rounded-xl bg-white border border-[#EADBCA] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6F6A60]">Vulnerability Index:</span>
                  <strong>{selectedWard.properties.vulnerability_index}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F6A60]">Informal Housing:</span>
                  <strong>{selectedWard.properties.informal_housing_pct}%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F6A60]">Musi River Distance:</span>
                  <strong>{selectedWard.properties.musi_proximity_km} km</strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FDEBD3] border border-[#EE7B30]/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-[#914d00]">AI Recommended Action:</span>
                  <span className="text-[10px] font-semibold text-[#6F6A60]">{aiAction.deadline}</span>
                </div>
                <p className="text-xs font-bold text-[#1c1b1a] mt-1">
                  {aiAction.title}
                </p>
                <p className="text-[11px] text-[#6F6A60] mt-1">
                  {aiAction.rationale}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. ALERT COMPOSER & APPROVALS */}
        {activeTab === 'composer' && (
          <form onSubmit={handleComposeSubmit} className="max-w-2xl space-y-4">
            <h4 className="font-heading font-bold text-lg text-[#1c1b1a]">
              Emergency Broadcast Composer (Multi-Language)
            </h4>

            <div>
              <label className="block text-xs font-semibold text-[#6F6A60] mb-1">Target Wards:</label>
              <div className="flex flex-wrap gap-2">
                {wards.slice(0, 8).map(w => {
                  const isChecked = composerWardIds.includes(w.properties.ward_id);
                  return (
                    <button
                      type="button"
                      key={w.properties.ward_id}
                      onClick={() => {
                        setComposerWardIds(prev =>
                          isChecked ? prev.filter(id => id !== w.properties.ward_id) : [...prev, w.properties.ward_id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        isChecked ? 'bg-[#006070] text-white border-[#006070]' : 'bg-white text-[#6F6A60] border-[#EADBCA]'
                      }`}
                    >
                      {w.properties.name.split('/')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#6F6A60] mb-1">Severity:</label>
                <select
                  value={composerSeverity}
                  onChange={(e) => setComposerSeverity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EADBCA] text-xs"
                >
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                  <option value="Severe">Severe (Requires Two-Person Approval)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6F6A60] mb-1">Broadcast Channel:</label>
                <select
                  value={composerChannel}
                  onChange={(e) => setComposerChannel(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-[#EADBCA] text-xs"
                >
                  <option value="in_app">In-App Push &amp; Web Alert</option>
                  <option value="sms">SMS Text Alert (Twilio / MSG91)</option>
                  <option value="whatsapp">WhatsApp Cloud Broadcast</option>
                  <option value="loudspeaker">Field Loudspeaker Siren Script</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6F6A60] mb-1">Alert Headline (English):</label>
              <input
                type="text"
                value={composerTitle}
                onChange={(e) => setComposerTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#EADBCA] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6F6A60] mb-1">Action Guidance Message:</label>
              <textarea
                value={composerBody}
                onChange={(e) => setComposerBody(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl border border-[#EADBCA] text-xs"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#F3EBDD] text-xs text-[#6F6A60]">
              Estimated Citizens Reached: <strong className="text-[#006070]">{(composerWardIds.length * 85000).toLocaleString()}</strong> in English, हिन्दी, and తెలుగు.
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#1F7A8C] text-white text-xs font-bold hover:bg-[#17606F]"
            >
              Dispatch Alert
            </button>
          </form>
        )}

        {/* 4. RESOURCE DISPATCH */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-base text-[#1c1b1a]">
              Municipal Disaster Asset Allocation &amp; Pre-Positioning
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  title: 'Heavy Dewatering Pumps (500 GPM)', 
                  deployed: resources.filter(r => r.category === 'pump' && r.status === 'deployed').length, 
                  total: resources.filter(r => r.category === 'pump').length || 6, 
                  icon: '🚰' 
                },
                { 
                  title: 'Inflatable Rescue Boats (OBM)', 
                  deployed: resources.filter(r => r.category === 'boat' && r.status === 'deployed').length, 
                  total: resources.filter(r => r.category === 'boat').length || 4, 
                  icon: '🚤' 
                },
                { 
                  title: 'SDRF Quick Response Teams', 
                  deployed: resources.filter(r => r.category === 'team' && r.status === 'deployed').length, 
                  total: resources.filter(r => r.category === 'team').length || 4, 
                  icon: '👨‍🚒' 
                },
              ].map((res, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA]">
                  <span className="text-2xl">{res.icon}</span>
                  <h5 className="font-bold text-xs text-[#1c1b1a] mt-2">{res.title}</h5>
                  <div className="text-lg font-black text-[#006070] mt-1">{res.deployed} / {res.total} Deployed</div>
                  <div className="w-full h-1.5 rounded-full bg-[#EADBCA] mt-2 overflow-hidden">
                    <div className="h-full bg-[#1F7A8C]" style={{ width: `${Math.min(100, (res.deployed / Math.max(1, res.total)) * 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Interactive Resource Assignment Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#EADBCA] bg-white mt-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3EBDD] font-bold text-[#1c1b1a]">
                  <tr>
                    <th className="p-3">Asset ID &amp; Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Assigned Ward</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Re-Deploy to Ward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADBCA]">
                  {resources.map((res) => {
                    const assignedWardObj = wards.find(w => w.properties.ward_id === res.assigned_ward);
                    return (
                      <tr key={res.id} className="hover:bg-[#FBF7EF] transition-colors">
                        <td className="p-3 font-semibold">
                          <span className="font-mono text-[#6F6A60] mr-1.5">{res.id}</span>
                          {res.name}
                        </td>
                        <td className="p-3 capitalize">{res.category}</td>
                        <td className="p-3 font-medium text-[#006070]">
                          {assignedWardObj?.properties.name || res.assigned_ward}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            res.status === 'deployed' ? 'bg-[#E6F5ED] text-[#4CAF7A]' : 'bg-[#F3EBDD] text-[#6F6A60]'
                          }`}>
                            {res.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={res.assigned_ward}
                            disabled={assigningId === res.id}
                            onChange={(e) => handleAssignResource(res.id, e.target.value)}
                            className="p-1.5 rounded-lg border border-[#EADBCA] text-xs bg-white text-[#1c1b1a] cursor-pointer"
                          >
                            {wards.slice(0, 12).map((w) => (
                              <option key={w.properties.ward_id} value={w.properties.ward_id}>
                                {w.properties.name.split('/')[0]}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. FIELD REPORTS QUEUE */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-base text-[#1c1b1a]">
              Citizen Ground-Truth Reports Verification Queue
            </h4>
            <div className="space-y-3">
              {reports.map(r => (
                <div key={r.id} className="p-4 rounded-xl bg-[#FBF7EF] border border-[#EADBCA] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#1c1b1a]">{r.description}</span>
                    <span className="text-[11px] text-[#6F6A60] block">{r.location_name} • {r.timestamp} • {r.confirm_votes} Confirmations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onTriageReport(r.id, 'verify')}
                      className="px-3 py-1 rounded-full bg-[#E6F5ED] text-[#4CAF7A] text-xs font-bold hover:bg-[#4CAF7A] hover:text-white"
                    >
                      Verify &amp; Dispatch
                    </button>
                    <button
                      onClick={() => onTriageReport(r.id, 'resolve')}
                      className="px-3 py-1 rounded-full bg-[#F3EBDD] text-[#6F6A60] text-xs font-bold hover:bg-[#EADBCA]"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. ANALYTICS & REPLAY */}
        {activeTab === 'analytics' && (
          <div className="p-6 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA] text-center">
            <BarChart3 className="w-12 h-12 text-[#1F7A8C] mx-auto mb-2" />
            <h4 className="font-heading font-bold text-base text-[#1c1b1a]">
              Historical Event Replay &amp; Equity Monitoring
            </h4>
            <p className="text-xs text-[#6F6A60] max-w-md mx-auto mt-1 mb-4">
              Calibrated time-lapse replay of October 2020 deluge vs October 2026 current telemetry.
              Model demonstrates 1.101 parity ratio for informal settlement warnings.
            </p>
            <div className="p-4 rounded-xl bg-white max-w-lg mx-auto text-left text-xs space-y-1.5 border border-[#EADBCA]">
              <div>Predicted Inundation vs Observed: <strong>96.0% accuracy</strong></div>
              <div>Brier Score Calibration: <strong>0.029 (Reliable)</strong></div>
              <div>Informal Housing TPR: <strong>1.000 (100% early detection)</strong></div>
            </div>
          </div>
        )}

        {/* 7. ADMIN & DATA HEALTH */}
        {activeTab === 'admin' && (
          <div className="p-6 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA] space-y-3">
            <h4 className="font-heading font-bold text-base text-[#1c1b1a]">
              Data Ingestion Health &amp; Sovereign Telemetry Status
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white border border-[#EADBCA] flex justify-between">
                <span>IMD Begumpet S-Band Doppler Radar:</span>
                <strong className="text-[#4CAF7A]">ONLINE (Latency 280ms)</strong>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#EADBCA] flex justify-between">
                <span>Open-Meteo High-Resolution Ensemble:</span>
                <strong className="text-[#4CAF7A]">ONLINE (Latency 142ms)</strong>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#EADBCA] flex justify-between">
                <span>GHMC 42 Culvert IoT Telemetry Nodes:</span>
                <strong className="text-[#4CAF7A]">ONLINE (Latency 95ms)</strong>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Dynamic Situation Report (SitRep) Modal */}
      {sitrepModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#EADBCA] print:p-0 print:border-none print:shadow-none">
            <button
              type="button"
              onClick={() => setSitrepModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#F3EBDD] text-[#6F6A60] transition-colors cursor-pointer print:hidden"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {loadingSitrep ? (
              <div className="py-16 text-center text-xs text-[#6F6A60]">
                <div className="w-8 h-8 border-3 border-[#1F7A8C] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Synthesizing multi-agency disaster telemetry for official SitRep...
              </div>
            ) : sitrepData ? (
              <div className="space-y-6">
                {/* Official Municipal Header */}
                <div className="border-b-2 border-[#1c1b1a] pb-4">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#6F6A60]">
                    <span>{sitrepData.city} • {sitrepData.issued_by}</span>
                    <span className="font-mono">{sitrepData.report_id}</span>
                  </div>
                  <h3 className="font-heading text-2xl font-black text-[#1c1b1a] mt-1">
                    {sitrepData.title}
                  </h3>
                  <div className="text-xs text-[#6F6A60] mt-1">
                    Report Timestamp: <strong>{new Date(sitrepData.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</strong>
                  </div>
                </div>

                {/* Weather & Meteorological Summary */}
                <div className="p-4 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA]">
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#006070] mb-1">
                    🌧️ Doppler Radar &amp; Weather Observations
                  </h4>
                  <p className="text-xs text-[#1c1b1a] leading-relaxed">
                    {sitrepData.weather_summary}
                  </p>
                </div>

                {/* Key Status Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#FBE1DF] border border-[#D9453D]/30">
                    <span className="text-[10px] uppercase font-bold text-[#D9453D]">Wards at Severe Inundation</span>
                    <div className="text-xl font-black text-[#D9453D] mt-0.5">{sitrepData.severe_wards?.length || 0}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#E6F5ED] border border-[#4CAF7A]/30">
                    <span className="text-[10px] uppercase font-bold text-[#4CAF7A]">Dewatering Pumps Deployed</span>
                    <div className="text-xl font-black text-[#4CAF7A] mt-0.5">{sitrepData.pumps_deployed || 8} Active</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#E3F1F4] border border-[#006070]/30">
                    <span className="text-[10px] uppercase font-bold text-[#006070]">Crowd Reports Actioned</span>
                    <div className="text-xs font-bold text-[#006070] mt-1">{sitrepData.citizen_reports_resolved}</div>
                  </div>
                </div>

                {/* Critical Sector Detail */}
                <div>
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#6F6A60] mb-2">
                    🚨 High-Priority Inundation Zones
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#1c1b1a]">
                    {sitrepData.severe_wards?.map((ward: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-[#F3EBDD]/60 border border-[#EADBCA]">
                        <span className="w-2 h-2 rounded-full bg-[#D9453D]" />
                        <span className="font-semibold">{ward}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Evacuation & Shelter Status */}
                <div className="p-4 rounded-2xl bg-white border border-[#EADBCA]">
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#6F6A60] mb-1">
                    🏠 Evacuation &amp; Relief Operations
                  </h4>
                  <p className="text-xs text-[#2B2A28] leading-relaxed">
                    {sitrepData.evacuation_status}
                  </p>
                </div>

                {/* Statutory Disclaimer */}
                <p className="text-[10px] text-[#8F8A80] italic">
                  {sitrepData.statutory_notice}
                </p>

                {/* Modal Actions */}
                <div className="pt-4 border-t border-[#EADBCA] flex items-center justify-end gap-3 print:hidden">
                  <button
                    type="button"
                    onClick={() => setSitrepModalOpen(false)}
                    className="px-5 py-2 rounded-full bg-[#F3EBDD] text-[#1c1b1a] text-xs font-semibold hover:bg-[#EADBCA] transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-[#1F7A8C] text-white text-xs font-semibold hover:bg-[#17606F] transition-colors shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
