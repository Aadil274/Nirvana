'use client';

import React from 'react';
import { RiskLevel, Horizon, SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';
import { Waves, Flame } from 'lucide-react';

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

  const arcLength = 188.5;
  const floodDashOffset = arcLength * (1 - Math.min(100, floodScore) / 100);
  const heatDashOffset = arcLength * (1 - Math.min(100, heatScore) / 100);

  const horizons: { id: Horizon; labelKey: string }[] = [
    { id: 'now', labelKey: 'now_label' },
    { id: '6h', labelKey: 'six_hours_label' },
    { id: '24h', labelKey: 'twenty_four_hours_label' },
    { id: '72h', labelKey: 'seventy_two_hours_label' },
  ];

  return (
    <div className="w-full bg-[#FFFFFF] rounded-card border border-[#EADBCA] p-6 lg:p-8 shadow-level1">
      {/* Top Header with Timeline Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#EADBCA]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F7A8C]">
            {getTranslation(currentLang, 'street_monitor_tag')}
          </span>
          <h2 className="font-heading text-xl lg:text-2xl font-bold text-[#1c1b1a]">
            {getTranslation(currentLang, 'hydro_thermal_title')}
          </h2>
        </div>

        {/* Timeline Horizon Chips */}
        <div className="flex items-center bg-[#F3EBDD] p-1 rounded-full border border-[#EADBCA]">
          {horizons.map((h) => (
            <button
              key={h.id}
              onClick={() => onHorizonChange(h.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                horizon === h.id
                  ? 'bg-white text-[#1c1b1a] shadow-sm'
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
        <div className="relative p-6 rounded-2xl bg-[#fdf9f5] border border-[#EADBCA] flex flex-col items-center text-center overflow-hidden">
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
              className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase"
              style={{ backgroundColor: floodColor.bg, color: floodColor.text }}
            >
              {getTranslation(currentLang, floodColor.labelKey)}
            </span>
          </div>

          <div className="relative w-48 h-28 my-2 flex items-center justify-center">
            <svg viewBox="0 0 160 90" className="w-full h-full">
              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke="#F3EBDD"
                strokeWidth="14"
                strokeLinecap="round"
              />
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
            </svg>

            <div className="absolute bottom-1 flex flex-col items-center">
              <span className="font-heading text-3xl font-extrabold text-[#1c1b1a] leading-none">
                {floodDepthCm}
                <span className="text-sm font-semibold text-[#6F6A60] ml-0.5">cm</span>
              </span>
              <span className="text-[11px] font-medium text-[#6F6A60] mt-0.5">
                {getTranslation(currentLang, 'projected_depth')}
              </span>
            </div>
          </div>

          <div className="w-full mt-4 pt-3 border-t border-[#EADBCA]/60 flex items-center justify-between text-xs text-[#6F6A60]">
            <span>{getTranslation(currentLang, 'drain_capacity_label')} <strong className="text-[#1c1b1a]">{getTranslation(currentLang, 'drain_blocked')}</strong></span>
            <span>{getTranslation(currentLang, 'confidence_label')} <strong className="text-[#1F7A8C]">{confidence}%</strong></span>
          </div>
        </div>

        {/* 2. HEAT RISK GAUGE */}
        <div className="relative p-6 rounded-2xl bg-[#fdf9f5] border border-[#EADBCA] flex flex-col items-center text-center overflow-hidden">
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
              className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase"
              style={{ backgroundColor: heatColor.bg, color: heatColor.text }}
            >
              {getTranslation(currentLang, heatColor.labelKey)}
            </span>
          </div>

          <div className="relative w-48 h-28 my-2 flex items-center justify-center">
            <svg viewBox="0 0 160 90" className="w-full h-full">
              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke="#F3EBDD"
                strokeWidth="14"
                strokeLinecap="round"
              />
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
            </svg>

            <div className="absolute bottom-1 flex flex-col items-center">
              <span className="font-heading text-3xl font-extrabold text-[#1c1b1a] leading-none">
                {heatTempC}
                <span className="text-sm font-semibold text-[#6F6A60] ml-0.5">°C</span>
              </span>
              <span className="text-[11px] font-medium text-[#6F6A60] mt-0.5">
                {getTranslation(currentLang, 'heat_index_label')}: {heatIndexC}°C
              </span>
            </div>
          </div>

          <div className="w-full mt-4 pt-3 border-t border-[#EADBCA]/60 flex items-center justify-between text-xs text-[#6F6A60]">
            <span>{getTranslation(currentLang, 'uhi_canopy_label')} <strong className="text-[#1c1b1a]">{getTranslation(currentLang, 'uhi_sparse')}</strong></span>
            <span>{getTranslation(currentLang, 'outdoor_risk_label')} <strong className="text-[#EE7B30]">{getTranslation(currentLang, 'risk_high')}</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};
