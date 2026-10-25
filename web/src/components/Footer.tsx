'use client';

import React from 'react';
import { Shield, Lock, Info, CheckCircle } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';

interface FooterProps {
  currentLang?: SupportedLanguage;
}

export const Footer: React.FC<FooterProps> = ({ currentLang = 'en' }) => {
  return (
    <footer className="w-full bg-[#F3EBDD]/70 text-[#1c1b1a] shadow-[0_1px_8px_rgba(0,0,0,0.04)] mt-24 pb-16 border-t border-[#EADBCA]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Brand & Mission */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#1F7A8C] flex items-center justify-center text-white">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading text-lg font-bold text-[#006070]">
                {getTranslation(currentLang, 'app_name') || 'Nirvana'}
              </span>
            </div>
            <p className="text-xs text-[#6F6A60] leading-relaxed">
              {getTranslation(currentLang, 'footer_mission')}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-[#006070] text-[11px] font-semibold border border-[#EADBCA]">
              <CheckCircle className="w-3.5 h-3.5 text-[#4CAF7A]" />
              <span>{getTranslation(currentLang, 'footer_ndma')}</span>
            </div>
          </div>

          {/* Emergency Helplines (Tap to Call) */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-[#006070] uppercase tracking-wider">
              {getTranslation(currentLang, 'footer_helplines')}
            </span>
            <div className="flex flex-col gap-2">
              <a
                href="tel:112"
                className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-[#fdf9f5] border border-[#EADBCA] transition-colors"
              >
                <span className="text-xs font-medium">{getTranslation(currentLang, 'footer_helpline_national')}</span>
                <span className="font-heading font-black text-sm text-[#D9453D]">112</span>
              </a>
              <a
                href="tel:108"
                className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-[#fdf9f5] border border-[#EADBCA] transition-colors"
              >
                <span className="text-xs font-medium">{getTranslation(currentLang, 'footer_helpline_ambulance')}</span>
                <span className="font-heading font-black text-sm text-[#EE7B30]">108</span>
              </a>
              <a
                href="tel:1070"
                className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-[#fdf9f5] border border-[#EADBCA] transition-colors"
              >
                <span className="text-xs font-medium">{getTranslation(currentLang, 'footer_helpline_state')}</span>
                <span className="font-heading font-black text-sm text-[#1F7A8C]">1070</span>
              </a>
            </div>
          </div>

          {/* Civic Portals Quicklinks */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-[#006070] uppercase tracking-wider">
              {getTranslation(currentLang, 'footer_portals')}
            </span>
            <ul className="flex flex-col gap-2 text-xs text-[#6F6A60]">
              <li>
                <a href="#monitor-section" className="hover:text-[#006070] transition-colors">
                  {getTranslation(currentLang, 'footer_portal_ward')}
                </a>
              </li>
              <li>
                <a href="#verified-shelters" className="hover:text-[#006070] transition-colors">
                  {getTranslation(currentLang, 'footer_portal_shelters')}
                </a>
              </li>
              <li>
                <a href="#live-risk-map" className="hover:text-[#006070] transition-colors">
                  {getTranslation(currentLang, 'footer_portal_maps')}
                </a>
              </li>
              <li>
                <a href="#citizen-reports-section" className="hover:text-[#006070] transition-colors">
                  {getTranslation(currentLang, 'footer_portal_volunteers')}
                </a>
              </li>
            </ul>
          </div>

          {/* Synthetic Data Notice */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-[#006070] uppercase tracking-wider">
              {getTranslation(currentLang, 'footer_synthetic_title')}
            </span>
            <div className="p-3.5 rounded-xl bg-white border border-[#EADBCA] text-xs text-[#6F6A60] leading-relaxed">
              <span className="flex items-center gap-1 text-[#914d00] font-bold mb-1">
                <Info className="w-3.5 h-3.5" />
                {getTranslation(currentLang, 'footer_synthetic_badge')}
              </span>
              {getTranslation(currentLang, 'footer_synthetic_desc')}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#6F6A60]">
              <Lock className="w-3 h-3" />
              <span>{getTranslation(currentLang, 'footer_sovereign')}</span>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-[#EADBCA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6F6A60]">
          <p>{getTranslation(currentLang, 'footer_copyright')}</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-[#006070] cursor-pointer">{getTranslation(currentLang, 'footer_a11y')}</span>
            <span className="hover:text-[#006070] cursor-pointer">{getTranslation(currentLang, 'footer_privacy')}</span>
            <span className="hover:text-[#006070] cursor-pointer">{getTranslation(currentLang, 'footer_ward_dir')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
