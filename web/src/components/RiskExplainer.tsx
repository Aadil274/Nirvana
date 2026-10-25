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
}

export const RiskExplainer: React.FC<RiskExplainerProps> = ({
  factors,
  wardName,
  elevationM,
  drainageHealth,
  currentLang
}) => {
  const localizedFactors = getLocalizedFactors(currentLang, factors);

  const shapContributions = [
    { labelKey: 'hand_label', score: 53.1, value: '< 1.2m', color: '#D9453D' },
    { labelKey: 'rain_forecast_label', score: 18.5, value: '55 mm/hr', color: '#EE7B30' },
    { labelKey: 'twi_label', score: 12.8, value: '11.8 (TWI)', color: '#F2B134' },
    { labelKey: 'drain_condition_label', score: 8.3, value: drainageHealth, color: '#1F7A8C' },
    { labelKey: 'musi_surge_label', score: 4.2, value: '0.4 - 1.6 km', color: '#1F7A8C' }
  ];

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
        {shapContributions.map((item, index) => (
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
