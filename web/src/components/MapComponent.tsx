'use client';

import React, { useState, useEffect } from 'react';
import { WardFeature, Shelter, CitizenReport } from '../types';
import { Layers, Play, Pause, RotateCcw, MapPin, Eye, Waves, Flame, Home, AlertCircle, Compass } from 'lucide-react';

interface MapComponentProps {
  wards: WardFeature[];
  shelters: Shelter[];
  reports: CitizenReport[];
  selectedWardId: string;
  onSelectWard: (wardId: string) => void;
  rainfallRate: number;
  simulatedTimeStep: number;
  onTimeStepChange: (step: number) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  wards,
  shelters,
  reports,
  selectedWardId,
  onSelectWard,
  rainfallRate,
  simulatedTimeStep,
  onTimeStepChange
}) => {
  const [activeLayers, setActiveLayers] = useState({
    flood: true,
    heat: false,
    shelters: true,
    drains: true,
    reports: true
  });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        onTimeStepChange((simulatedTimeStep + 1) % 4);
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, simulatedTimeStep, onTimeStepChange]);

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Convert geo coordinates to local SVG bounds
  // Longitude range: 78.33 to 78.58 (delta ~0.25) -> X: 50 to 750
  // Latitude range: 17.30 to 17.52 (delta ~0.22) -> Y: 450 to 50 (inverted Y)
  const projectPoint = (lng: number, lat: number) => {
    const minLng = 78.32;
    const maxLng = 78.58;
    const minLat = 17.30;
    const maxLat = 17.53;

    const x = 50 + ((lng - minLng) / (maxLng - minLng)) * 700;
    const y = 450 - ((lat - minLat) / (maxLat - minLat)) * 400;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const selectedWard = wards.find(w => w.properties.ward_id === selectedWardId) || wards[0];

  const getPolygonFill = (ward: WardFeature) => {
    if (activeLayers.heat) {
      const score = ward.properties.heat_score || 40;
      if (score >= 75) return '#FDEBD3';
      if (score >= 55) return '#FDF3D8';
      return '#fdf9f5';
    }
    // Default Flood layer
    const score = ward.properties.flood_score || 50;
    if (score >= 75) return '#FBE1DF';
    if (score >= 55) return '#FDE6D6';
    if (score >= 35) return '#FDF3D8';
    return '#E6F5ED';
  };

  const getPolygonStroke = (ward: WardFeature) => {
    if (ward.properties.ward_id === selectedWardId) return '#1F7A8C';
    if (activeLayers.heat) {
      const score = ward.properties.heat_score || 40;
      if (score >= 75) return '#D9453D';
      if (score >= 55) return '#EE7B30';
      return '#4CAF7A';
    }
    const score = ward.properties.flood_score || 50;
    if (score >= 75) return '#D9453D';
    if (score >= 55) return '#EE7B30';
    if (score >= 35) return '#F2B134';
    return '#4CAF7A';
  };

  return (
    <div className="w-full bg-[#FFFFFF] rounded-card border border-[#EADBCA] p-6 lg:p-8 shadow-level1" id="live-risk-map">
      {/* Top Map Header & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-[#EADBCA]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F7A8C]">
            GEOSPATIAL SITUATIONAL AWARENESS
          </span>
          <h3 className="font-heading text-xl lg:text-2xl font-bold text-[#1c1b1a]">
            Hyderabad Hyperlocal Risk Map
          </h3>
          <p className="text-xs text-[#6F6A60] mt-0.5">
            Light cream vector canvas showing 22 monitored wards, Musi River basin, and storm drains.
          </p>
        </div>

        {/* LAYER TOGGLE PILLS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => toggleLayer('flood')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              activeLayers.flood
                ? 'bg-[#E3F1F4] text-[#006070] border-[#1F7A8C]'
                : 'bg-white text-[#6F6A60] border-[#EADBCA]'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Flood Inundation</span>
          </button>

          <button
            onClick={() => toggleLayer('heat')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              activeLayers.heat
                ? 'bg-[#FDEBD3] text-[#914d00] border-[#EE7B30]'
                : 'bg-white text-[#6F6A60] border-[#EADBCA]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Urban Heat</span>
          </button>

          <button
            onClick={() => toggleLayer('shelters')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              activeLayers.shelters
                ? 'bg-[#E6F5ED] text-[#4CAF7A] border-[#4CAF7A]'
                : 'bg-white text-[#6F6A60] border-[#EADBCA]'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Shelters ({shelters.length})</span>
          </button>

          <button
            onClick={() => toggleLayer('reports')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              activeLayers.reports
                ? 'bg-[#FBE1DF] text-[#D9453D] border-[#D9453D]'
                : 'bg-white text-[#6F6A60] border-[#EADBCA]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Citizen Reports ({reports.length})</span>
          </button>
        </div>
      </div>

      {/* MAP VIEWFINDER & CANVAS */}
      <div className="relative w-full h-[520px] rounded-2xl bg-[#FBF7EF] border border-[#EADBCA] mt-6 overflow-hidden flex">
        
        {/* SVG VECTOR MAP CANVAS */}
        <div className="relative flex-1 h-full overflow-hidden">
          <svg
            viewBox="0 0 800 500"
            className="w-full h-full select-none"
            style={{ backgroundColor: '#FBF7EF' }}
          >
            {/* Grid texture */}
            <defs>
              <pattern id="light-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#EADBCA" strokeWidth="0.6" strokeOpacity="0.6" />
              </pattern>
            </defs>
            <rect width="800" height="500" fill="url(#light-grid)" />

            {/* Musi River Primary Waterway Line */}
            <path
              d="M 230 330 Q 340 340 430 335 T 590 310 T 740 280"
              fill="none"
              stroke="#3A8FD6"
              strokeWidth="10"
              strokeLinecap="round"
              strokeOpacity="0.45"
            />
            <text x="440" y="325" fill="#3A8FD6" fontSize="10" fontWeight="bold" letterSpacing="2">
              MUSI RIVER FLOOD CORRIDOR
            </text>

            {/* Hussain Sagar Waterbody */}
            <ellipse cx="440" cy="210" rx="32" ry="24" fill="#3A8FD6" fillOpacity="0.35" stroke="#3A8FD6" strokeWidth="1.5" />
            <text x="410" y="214" fill="#005b93" fontSize="9" fontWeight="bold">
              Hussain Sagar
            </text>

            {/* WARD POLYGONS */}
            {wards.map((ward) => {
              const coords = ward.geometry.coordinates[0];
              const pointsStr = coords.map(c => projectPoint(c[0], c[1])).join(' ');
              const isSelected = ward.properties.ward_id === selectedWardId;

              // Centroid for label
              const avgLng = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;
              const avgLat = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;
              const [labelX, labelY] = projectPoint(avgLng, avgLat).split(',').map(Number);

              return (
                <g key={ward.properties.ward_id} className="cursor-pointer transition-opacity" onClick={() => onSelectWard(ward.properties.ward_id)}>
                  <polygon
                    points={pointsStr}
                    fill={getPolygonFill(ward)}
                    stroke={getPolygonStroke(ward)}
                    strokeWidth={isSelected ? '4' : '1.8'}
                    strokeDasharray={isSelected ? '6,3' : 'none'}
                    className="hover:opacity-85 transition-all"
                  />
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    fill="#1c1b1a"
                    fontSize="9.5"
                    fontWeight={isSelected ? 'bold' : '600'}
                    className="pointer-events-none select-none"
                  >
                    {ward.properties.name.split('/')[0]}
                  </text>
                  <text
                    x={labelX}
                    y={labelY + 11}
                    textAnchor="middle"
                    fill={getPolygonStroke(ward)}
                    fontSize="8.5"
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    {activeLayers.heat ? `${ward.properties.heat_temp_c || 35}°C` : `${ward.properties.flood_depth_cm || 15}cm`}
                  </text>
                </g>
              );
            })}

            {/* SHELTER PINS */}
            {activeLayers.shelters && shelters.map(s => {
              const [px, py] = projectPoint(s.lng, s.lat).split(',').map(Number);
              return (
                <g key={s.id} transform={`translate(${px}, ${py})`} className="cursor-pointer" onClick={() => onSelectWard(s.ward_id)}>
                  <circle r="7" fill="#4CAF7A" stroke="#FFFFFF" strokeWidth="2" />
                  <text x="0" y="3" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">S</text>
                </g>
              );
            })}

            {/* CITIZEN REPORT PINS */}
            {activeLayers.reports && reports.map(r => {
              const [rx, ry] = projectPoint(r.lng, r.lat).split(',').map(Number);
              return (
                <g key={r.id} transform={`translate(${rx}, ${ry})`} className="cursor-pointer">
                  <circle r="6" fill="#D9453D" stroke="#FFFFFF" strokeWidth="2" className="animate-ping" opacity="0.4" />
                  <circle r="5" fill="#D9453D" stroke="#FFFFFF" strokeWidth="1.5" />
                </g>
              );
            })}
          </svg>

          {/* Compass & Map Legend */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-2xl border border-[#EADBCA] p-3 shadow-level1 flex flex-col gap-2 text-xs">
            <span className="font-bold text-[#1c1b1a] flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#1F7A8C]" />
              Hydrological Basins
            </span>
            <div className="flex items-center gap-2 text-[11px] text-[#6F6A60]">
              <span className="w-3 h-3 rounded-full bg-[#D9453D]"></span> Severe (&gt;75)
              <span className="w-3 h-3 rounded-full bg-[#EE7B30]"></span> High (55-75)
              <span className="w-3 h-3 rounded-full bg-[#4CAF7A]"></span> Low (&lt;35)
            </div>
          </div>
        </div>

        {/* SELECTED WARD DRAWER (SIDE PANEL) */}
        <div className="w-80 shrink-0 bg-[#FFFFFF] border-l border-[#EADBCA] p-5 flex flex-col justify-between hidden md:flex">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F7A8C]">
                {selectedWard.properties.circle} • {selectedWard.properties.zone}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBE1DF] text-[#D9453D]">
                {selectedWard.properties.flood_level || 'Severe'}
              </span>
            </div>

            <h4 className="font-heading text-lg font-bold text-[#1c1b1a] mb-1">
              {selectedWard.properties.name}
            </h4>
            <span className="text-xs text-[#6F6A60] block mb-4">
              Population: {selectedWard.properties.population.toLocaleString()} | Area: {selectedWard.properties.area_sqkm} sq.km
            </span>

            {/* Quick Metrics */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#FBF7EF] border border-[#EADBCA]">
                <span className="text-[#6F6A60]">Base Elevation:</span>
                <strong className="text-[#1c1b1a]">{selectedWard.properties.base_elevation_m}m MSL</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#FBF7EF] border border-[#EADBCA]">
                <span className="text-[#6F6A60]">Drainage Status:</span>
                <strong className="text-[#EE7B30]">{selectedWard.properties.drainage_health}</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#FBF7EF] border border-[#EADBCA]">
                <span className="text-[#6F6A60]">Expected Water Depth:</span>
                <strong className="text-[#D9453D]">{selectedWard.properties.flood_depth_cm || 25} cm</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#FBF7EF] border border-[#EADBCA]">
                <span className="text-[#6F6A60]">Active Relief Shelters:</span>
                <strong className="text-[#4CAF7A]">{selectedWard.properties.active_shelters} Centres</strong>
              </div>
            </div>

            {/* Action Notice */}
            <div className="mt-4 p-3 rounded-xl bg-[#FDEBD3] border border-[#EE7B30]/30 text-[11px] text-[#914d00]">
              <strong>AI Action Recommendation:</strong> Pre-position 2 mobile de-watering pumps at colony nala bridge.
            </div>
          </div>

          <button
            onClick={() => {
              const el = document.getElementById('monitor-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full py-2.5 rounded-full bg-[#1F7A8C] text-white text-xs font-semibold hover:bg-[#17606F] transition-colors text-center"
          >
            Inspect Ward Telemetry
          </button>
        </div>
      </div>

      {/* TIMELINE TIME SCRUBBER WITH PLAY/PAUSE */}
      <div className="mt-6 pt-4 border-t border-[#EADBCA] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1F7A8C] text-white hover:bg-[#17606F] text-xs font-semibold shadow-sm transition-all"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Forecast' : 'Play Forecast Scrubber'}</span>
          </button>
          <span className="text-xs text-[#6F6A60]">
            Time Horizon: <strong>{['Now (T+0)', '+6 Hours (T+6)', '+24 Hours (T+24)', '+72 Hours (T+72)'][simulatedTimeStep]}</strong>
          </span>
        </div>

        {/* Steps Slider */}
        <div className="flex items-center gap-2 w-full sm:w-64">
          <input
            type="range"
            min="0"
            max="3"
            value={simulatedTimeStep}
            onChange={(e) => onTimeStepChange(Number(e.target.value))}
            className="w-full accent-[#1F7A8C] h-2 bg-[#F3EBDD] rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
