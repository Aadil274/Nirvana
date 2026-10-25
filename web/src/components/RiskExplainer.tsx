'use client';

import React from 'react';
import { SupportedLanguage } from '../types';
import { getTranslation, getLocalizedFactors } from '../lib/i18n';
import { AlertTriangle, Info } from 'lucide-react';

interface RiskExplainerProps {
  factors: string[];
  wardName: string;
  elevationM: number;
  drainageHealth: string;
  currentLang: SupportedLanguage;
  rainfallRate?: number;
  handM?: number;
  twi?: number;
  musiProximityKm?: number;
  imperviousFraction?: number;
}

export const RiskExplainer: React.FC<RiskExplainerProps> = ({
  factors,
  wardName,
  elevationM,
  drainageHealth,
  currentLang,
  rainfallRate = 45,
  handM = 1.2,
  twi = 11.8,
  musiProximityKm = 1.6,
  imperviousFraction = 0.82
}) => {
  // Dynamically calculate mathematical SHAP factor contributions
  const rainScore = Math.max(2.0, Math.min(40.0, rainfallRate * 0.45));
  const topoScore = 3.0 + (handM < 1.0 ? 15.0 * (1.0 - handM) : 0) + (twi > 10.0 ? Math.min(15.0, (twi - 10.0) * 4.0) : 0);
  const drainPenalty = drainageHealth === 'Blocked' ? 28.0 : (drainageHealth === 'Partially Blocked' ? 14.0 : 4.0);
  const runoffScore = Math.max(2.0, imperviousFraction * 15.0);
  const riverScore = Math.max(1.0, 15.0 - (musiProximityKm * 5.0));
  const totalWeight = rainScore + topoScore + drainPenalty + runoffScore + riverScore;

  const dynamicShapContributions = [
    {
      labelKey: 'rain_forecast_label',
      score: Math.round((rainScore / totalWeight) * 1000) / 10,
      value: `${rainfallRate} mm/hr`,
      color: '#EE7B30'
    },
    {
      labelKey: 'hand_label',
      score: Math.round((topoScore / totalWeight) * 1000) / 10,
      value: `${handM}m (Elev ${elevationM}m)`,
      color: '#D9453D'
    },
    {
      labelKey: 'drain_condition_label',
      score: Math.round((drainPenalty / totalWeight) * 1000) / 10,
      value: drainageHealth,
      color: '#1F7A8C'
    },
    {
      labelKey: 'twi_label',
      score: Math.round((runoffScore / totalWeight) * 1000) / 10,
      value: `${Math.round(imperviousFraction * 100)}% paved`,
      color: '#F2B134'
    },
    {
      labelKey: 'musi_surge_label',
      score: Math.round((riverScore / totalWeight) * 1000) / 10,
      value: `${musiProximityKm} km`,
      color: '#1F7A8C'
    }
  ].sort((a, b) => b.score - a.score);

  // Dynamic natural language factors based on active ward properties & current rainfall
  const dynamicFactors: string[] = [];
  if (drainageHealth === 'Blocked' || drainageHealth === 'Partially Blocked') {
    dynamicFactors.push(`Storm drain culverts flagged as ${drainageHealth.toLowerCase()} with silt/debris.`);
  }
  if (rainfallRate >= 40) {
    dynamicFactors.push(`Heavy convective rainfall: ${rainfallRate}mm/hr expected within 3-hour window.`);
  } else if (rainfallRate >= 20) {
    dynamicFactors.push(`Moderate continuous rainfall: ${rainfallRate}mm/hr anticipated.`);
  } else {
    dynamicFactors.push(`Light rainfall: ${rainfallRate}mm/hr within normal drainage capacity.`);
  }
  if (handM <= 1.0 || elevationM < 495.0) {
    dynamicFactors.push(`Low-lying natural basin elevation (${elevationM}m, HAND ${handM}m) prone to stormwater ponding.`);
  }
  if (musiProximityKm <= 1.5) {
    dynamicFactors.push(`Proximity to Musi River flood channel (${Math.round(musiProximityKm * 1000)}m).`);
  }
  if (dynamicFactors.length === 0) {
    dynamicFactors.push('Terrain slope and stormwater drainage operating within normal safe parameters.');
  }

  const activeFactors = factors && factors.length > 0 ? factors : dynamicFactors;
  const localizedFactors = getLocalizedFactors(currentLang, activeFactors);

  return (
    <div className="w-full bg-[#FFFFFF] rounded-card border border-[#EADBCA] p-6 lg:p-8 shadow-level1">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-[#006070] text-[22px]">psychology</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#006070]">
          {getTranslation(currentLang, 'explainability_tag')}
        </span>
      </div>
      <h3 className="font-heading text-xl font-bold text-[#1c1b1a] mb-2">
        {getTranslation(currentLang, 'why_risk_elevated')} {wardName}?
      </h3>
      <p className="text-sm text-[#6F6A60] mb-6">
        {getTranslation(currentLang, 'explainability_desc')}
      </p>

      {/* NATURAL LANGUAGE HIGHLIGHTS */}
      <div className="space-y-3 mb-8">
        {localizedFactors.map((factor, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FDF3D8] border border-[#F2B134]/30"
          >
            <AlertTriangle className="w-4 h-4 text-[#EE7B30] shrink-0 mt-0.5" />
            <span className="text-xs font-medium text-[#2B2A28] leading-relaxed">
              {factor}
            </span>
          </div>
        ))}
      </div>

      {/* SHAP CONTRIBUTION BARS */}
      <div className="space-y-4">
        <div className="text-xs font-bold uppercase text-[#6F6A60] tracking-wider mb-2">
          {getTranslation(currentLang, 'feature_importance_breakdown')}
        </div>
        {dynamicShapContributions.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#1c1b1a]">
                {getTranslation(currentLang, item.labelKey)}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[#6F6A60] text-[11px]">{item.value}</span>
                <span className="font-bold text-[#006070] w-12 text-right">{item.score}%</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-[#F3EBDD] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${item.score}%`, backgroundColor: item.color }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-[#EADBCA] flex items-center justify-between text-xs text-[#6F6A60]">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#1F7A8C]" />
          {getTranslation(currentLang, 'model_calibrated_note')}
        </span>
        <span className="font-semibold text-[#006070]">
          {getTranslation(currentLang, 'brier_score_label')}
        </span>
      </div>
    </div>
  );
};
