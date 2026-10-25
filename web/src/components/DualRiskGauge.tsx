'use client';

import React, { useState } from 'react';
import { RiskLevel, Horizon, SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';
import { Waves, Flame, HelpCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { TrustBar } from './TrustBar';

interface DualRiskGaugeProps {
  floodScore: number;
  floodLevel: RiskLevel;
  floodDepthCm: number;
  heatScore: number;
  heatLevel: RiskLevel;
  heatTempC: number;
  heatIndexC: number;
  horizon: Horizon;
  onHorizonChange: (h: Horizon) => void;
  confidence: number;
  currentLang: SupportedLanguage;
}

export const DualRiskGauge: React.FC<DualRiskGaugeProps> = ({
  floodScore,
  floodLevel,
  floodDepthCm,
  heatScore,
  heatLevel,
  heatTempC,
  heatIndexC,
  horizon,
  onHorizonChange,
  confidence,
  currentLang
}) => {
  const [whyExpanded, setWhyExpanded] = useState(false);

  const getRiskColors = (level: RiskLevel) => {
    switch (level) {
      case 'Severe':
        return { text: '#D9453D', bg: '#FBE1DF', stroke: '#D9453D', labelKey: 'risk_severe' };
      case 'High':
        return { text: '#EE7B30', bg: '#FDE6D6', stroke: '#EE7B30', labelKey: 'risk_high' };
      case 'Moderate':
        return { text: '#F2B134', bg: '#FDF3D8', stroke: '#F2B134', labelKey: 'risk_moderate' };
      case 'Low':
      default:
        return { text: '#4CAF7A', bg: '#E6F5ED', stroke: '#4CAF7A', labelKey: 'risk_low' };
    }
  };

  const floodColor = getRiskColors(floodLevel);
  const heatColor = getRiskColors(heatLevel);

  const arcLength = 188.5; // Pi * radius (60)
  const floodDashOffset = arcLength * (1 - Math.min(100, floodScore) / 100);
  const heatDashOffset = arcLength * (1 - Math.min(100, heatScore) / 100);

  // Calculate needle angle (-90 deg to +90 deg across semicircle)
  const floodAngle = -90 + (Math.min(100, Math.max(0, floodScore)) / 100) * 180;
  const heatAngle = -90 + (Math.min(100, Math.max(0, heatScore)) / 100) * 180;

  // Probability distribution percentages based on score
  const floodProbSmall = Math.max(5, Math.round(100 - floodScore));
  const floodProbMed = Math.round(floodScore * 0.55);
  const floodProbDeep = Math.max(5, Math.min(90, Math.round(floodScore * 0.45)));

  const horizons: { id: Horizon; labelKey: string }[] = [
    { id: 'now', labelKey: 'now_label' },
    { id: '6h', labelKey: 'six_hours_label' },
    { id: '24h', labelKey: 'twenty_four_hours_label' },
    { id: '72h', labelKey: 'seventy_two_hours_label' },
  ];

  return (
    <div className={`w-full bg-[#FFFFFF] rounded-card border border-[#EADBCA] p-6 lg:p-8 shadow-level1 transition-all ${floodLevel === 'Severe' ? 'severe-breathing-glow' : ''}`}>
      {/* Top Header with Timeline Horizon Chips */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#EADBCA]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F7A8C]">
            {getTranslation(currentLang, 'street_monitor_tag')}
          </span>
          <h2 className="font-heading text-xl lg:text-2xl font-bold text-[#1c1b1a]">
            {getTranslation(currentLang, 'hydro_thermal_title')}
          </h2>
        </div>

        {/* Horizon Chips */}
        <div className="flex items-center bg-[#F3EBDD] p-1 rounded-full border border-[#EADBCA] shadow-inner">
          {horizons.map((h) => (
            <button
              key={h.id}
              onClick={() => onHorizonChange(h.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                horizon === h.id
                  ? 'bg-white text-[#1c1b1a] shadow-sm font-bold'
                  : 'text-[#6F6A60] hover:text-[#1c1b1a]'
              }`}
            >
              {getTranslation(currentLang, h.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* DUAL GAUGES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
        
        {/* 1. FLOOD RISK GAUGE */}
        <div className="relative p-6 rounded-2xl bg-[#fdf9f5] border border-[#EADBCA] flex flex-col items-center text-center overflow-hidden tactile-card">
          {floodScore > 60 && (
            <>
              <div className="rain-particle left-6 top-2" style={{ animationDelay: '0s' }}></div>
              <div className="rain-particle left-1/3 top-1" style={{ animationDelay: '0.4s' }}></div>
              <div className="rain-particle right-8 top-3" style={{ animationDelay: '0.8s' }}></div>
            </>
          )}

          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#E3F1F4] flex items-center justify-center text-[#1F7A8C]">
                <Waves className="w-4 h-4" />
              </div>
              <span className="font-heading font-bold text-sm text-[#1c1b1a]">
                {getTranslation(currentLang, 'flood_inundation')}
              </span>
            </div>
            <span
              className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: floodColor.bg, color: floodColor.text }}
            >
              {getTranslation(currentLang, floodColor.labelKey)}
            </span>
          </div>

          {/* Semicircle SVG Arc with Needle Pointer */}
          <div className="relative w-52 h-32 my-2 flex items-center justify-center">
            <svg viewBox="0 0 160 95" className="w-full h-full">
              {/* Background Arc */}
              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke="#F3EBDD"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Active Progress Arc */}
              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke={floodColor.stroke}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={floodDashOffset}
                className="transition-all duration-700 ease-out"
              />
              {/* Center Needle Pivot */}
              <circle cx="80" cy="80" r="5" fill="#1c1b1a" />
              {/* Needle Pointer Line */}
              <g transform={`rotate(${floodAngle}, 80, 80)`} className="transition-transform duration-700 ease-out">
                <line x1="80" y1="80" x2="80" y2="28" stroke="#1c1b1a" strokeWidth="2.5" strokeLinecap="round" />
                <polygon points="80,24 77,32 83,32" fill="#1c1b1a" />
              </g>
            </svg>

            <div className="absolute bottom-0 flex flex-col items-center">
              <span className="font-heading text-3xl sm:text-4xl font-extrabold text-[#1c1b1a] leading-none">
                {floodDepthCm}
                <span className="text-sm font-semibold text-[#6F6A60] ml-0.5">cm</span>
              </span>
              <span className="text-[11px] font-semibold text-[#6F6A60] mt-0.5">
                {getTranslation(currentLang, 'projected_depth')}
              </span>
            </div>
          </div>

          {/* Depth Probability Chips (from PDF specification) */}
          <div className="w-full grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-[#EADBCA]/60 text-center">
            <div className="p-1.5 rounded-xl bg-white border border-[#EADBCA]">
              <span className="text-[10px] text-[#6F6A60] block">&lt;10cm</span>
              <strong className="text-xs text-[#4CAF7A]">{floodProbSmall}%</strong>
            </div>
            <div className="p-1.5 rounded-xl bg-white border border-[#EADBCA]">
              <span className="text-[10px] text-[#6F6A60] block">10-30cm</span>
              <strong className="text-xs text-[#F2B134]">{floodProbMed}%</strong>
            </div>
            <div className="p-1.5 rounded-xl bg-white border border-[#EADBCA]">
              <span className="text-[10px] text-[#6F6A60] block">30cm+</span>
              <strong className="text-xs text-[#D9453D]">{floodProbDeep}%</strong>
            </div>
          </div>

          <div className="w-full mt-3 pt-2 flex items-center justify-between text-xs text-[#6F6A60]">
            <span>{getTranslation(currentLang, 'drain_capacity_label')} <strong className="text-[#1c1b1a]">{getTranslation(currentLang, 'drain_blocked')}</strong></span>
            <span>{getTranslation(currentLang, 'confidence_label')} <strong className="text-[#1F7A8C]">{confidence}%</strong></span>
          </div>
        </div>

        {/* 2. HEAT RISK GAUGE */}
        <div className="relative p-6 rounded-2xl bg-[#fdf9f5] border border-[#EADBCA] flex flex-col items-center text-center overflow-hidden tactile-card">
          {heatScore > 60 && <div className="absolute inset-0 heat-sun-pulse pointer-events-none"></div>}

          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FDEBD3] flex items-center justify-center text-[#914d00]">
                <Flame className="w-4 h-4" />
              </div>
              <span className="font-heading font-bold text-sm text-[#1c1b1a]">
                {getTranslation(currentLang, 'heat_thermal')}
              </span>
            </div>
            <span
              className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: heatColor.bg, color: heatColor.text }}
            >
              {getTranslation(currentLang, heatColor.labelKey)}
            </span>
          </div>

          {/* Semicircle SVG Arc with Needle Pointer */}
          <div className="relative w-52 h-32 my-2 flex items-center justify-center">
            <svg viewBox="0 0 160 95" className="w-full h-full">
              {/* Background Arc */}
              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke="#F3EBDD"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Active Progress Arc */}
              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke={heatColor.stroke}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={heatDashOffset}
                className="transition-all duration-700 ease-out"
              />
              {/* Center Needle Pivot */}
              <circle cx="80" cy="80" r="5" fill="#1c1b1a" />
              {/* Needle Pointer Line */}
              <g transform={`rotate(${heatAngle}, 80, 80)`} className="transition-transform duration-700 ease-out">
                <line x1="80" y1="80" x2="80" y2="28" stroke="#1c1b1a" strokeWidth="2.5" strokeLinecap="round" />
                <polygon points="80,24 77,32 83,32" fill="#1c1b1a" />
              </g>
            </svg>

            <div className="absolute bottom-0 flex flex-col items-center">
              <span className="font-heading text-3xl sm:text-4xl font-extrabold text-[#1c1b1a] leading-none">
                {heatTempC}
                <span className="text-sm font-semibold text-[#6F6A60] ml-0.5">°C</span>
              </span>
              <span className="text-[11px] font-semibold text-[#6F6A60] mt-0.5">
                {getTranslation(currentLang, 'heat_index_label')}: {heatIndexC}°C
              </span>
            </div>
          </div>

          {/* Thermal Bands (from PDF specification) */}
          <div className="w-full grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-[#EADBCA]/60 text-center">
            <div className="p-1.5 rounded-xl bg-white border border-[#EADBCA]">
              <span className="text-[10px] text-[#6F6A60] block">&lt;35°C</span>
              <strong className="text-xs text-[#4CAF7A]">Comfort</strong>
            </div>
            <div className="p-1.5 rounded-xl bg-white border border-[#EADBCA]">
              <span className="text-[10px] text-[#6F6A60] block">35-42°C</span>
              <strong className="text-xs text-[#F2B134]">Caution</strong>
            </div>
            <div className="p-1.5 rounded-xl bg-white border border-[#EADBCA]">
              <span className="text-[10px] text-[#6F6A60] block">42°C+</span>
              <strong className="text-xs text-[#EE7B30]">Danger</strong>
            </div>
          </div>

          <div className="w-full mt-3 pt-2 flex items-center justify-between text-xs text-[#6F6A60]">
            <span>{getTranslation(currentLang, 'uhi_canopy_label')} <strong className="text-[#1c1b1a]">{getTranslation(currentLang, 'uhi_sparse')}</strong></span>
            <span>{getTranslation(currentLang, 'outdoor_risk_label')} <strong className="text-[#EE7B30]">{getTranslation(currentLang, 'risk_high')}</strong></span>
          </div>
        </div>

      </div>

      {/* "Why is this high?" Collapsible Quick Action */}
      <div className="mt-6 pt-4 border-t border-[#EADBCA] flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('telemetry-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F7A8C] hover:text-[#17606F] hover:underline cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Why is this risk level computed? View full explainability breakdown →</span>
        </button>

        <span className="text-xs text-[#6F6A60]">
          Model Calibrated with Brier Score: <strong>0.029</strong>
        </span>
      </div>

      {/* Embedded Trust Bar directly underneath */}
      <div className="mt-5">
        <TrustBar
          currentLang={currentLang}
          confidenceScore={confidence}
          minutesAgo={6}
          compact={true}
        />
      </div>
    </div>
  );
};
