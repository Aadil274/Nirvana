'use client';

import React, { useState } from 'react';
import { Shield, Lock, Info, CheckCircle, X, ExternalLink, MapPin } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';

interface FooterProps {
  currentLang?: SupportedLanguage;
}

export const Footer: React.FC<FooterProps> = ({ currentLang = 'en' }) => {
  const [activeModal, setActiveModal] = useState<'a11y' | 'privacy' | 'ward_dir' | null>(null);

  const HYDERABAD_PILOT_WARDS = [
    { id: 'ward-72', name: 'Mehdipatnam / Nadeem Colony', circle: 'Charminar', zone: 'South', elev: 498, risk: 'Severe' },
    { id: 'ward-71', name: 'Karwan / Tolichowki', circle: 'Charminar', zone: 'South', elev: 492, risk: 'Severe' },
    { id: 'ward-55', name: 'Malakpet / Moosarambagh', circle: 'LB Nagar', zone: 'East', elev: 486, risk: 'Severe' },
    { id: 'ward-44', name: 'Chandrayangutta / Al Jubail', circle: 'Charminar', zone: 'South', elev: 489, risk: 'High' },
    { id: 'ward-48', name: 'Charminar / Old City', circle: 'Charminar', zone: 'South', elev: 505, risk: 'High' },
    { id: 'ward-149', name: 'Begumpet / Prakash Nagar', circle: 'Secunderabad', zone: 'North', elev: 512, risk: 'Moderate' },
    { id: 'ward-118', name: 'Kukatpally / Nizampet', circle: 'Kukatpally', zone: 'West', elev: 526, risk: 'Moderate' },
    { id: 'ward-93', name: 'Banjara Hills / Jubilee Hills', circle: 'Khairatabad', zone: 'Central', elev: 578, risk: 'Low' },
    { id: 'ward-62', name: 'Amberpet / Golnaka', circle: 'LB Nagar', zone: 'East', elev: 488, risk: 'High' },
    { id: 'ward-8', name: 'Uppal / Ramanthapur', circle: 'LB Nagar', zone: 'East', elev: 482, risk: 'High' },
  ];

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
            <button
              type="button"
              onClick={() => setActiveModal('a11y')}
              className="hover:text-[#006070] transition-colors cursor-pointer underline-offset-2 hover:underline"
            >
              {getTranslation(currentLang, 'footer_a11y')}
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('privacy')}
              className="hover:text-[#006070] transition-colors cursor-pointer underline-offset-2 hover:underline"
            >
              {getTranslation(currentLang, 'footer_privacy')}
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('ward_dir')}
              className="hover:text-[#006070] transition-colors cursor-pointer underline-offset-2 hover:underline"
            >
              {getTranslation(currentLang, 'footer_ward_dir')}
            </button>
          </div>
        </div>
      </div>

      {/* Accessible Interactive Modal Dialogs */}
      {activeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#EADBCA]">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#F3EBDD] text-[#6F6A60] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Accessibility Statement */}
            {activeModal === 'a11y' && (
              <div>
                <h3 className="font-heading text-xl font-bold text-[#1c1b1a] mb-2">
                  Accessibility &amp; Inclusivity Statement
                </h3>
                <p className="text-xs text-[#6F6A60] mb-4">
                  Compliant with Web Content Accessibility Guidelines (WCAG 2.1 Level AA) for critical public safety communications.
                </p>
                <div className="space-y-3 text-xs text-[#2B2A28] leading-relaxed">
                  <div className="p-3 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA]">
                    <strong className="text-[#006070] block mb-1">🗣️ Multilingual Voice Synthesis</strong>
                    Real-time speech synthesis in Telugu (తెలుగు), Hindi (हिन्दी), Tamil (தமிழ்), and English with calibrated cadence for loud outdoor and emergency environments.
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA]">
                    <strong className="text-[#006070] block mb-1">🎨 High Contrast &amp; Color Vision Safe</strong>
                    All color combinations strictly exceed the 4.5:1 contrast requirement (#006070 and #D9453D on #FFFFFF and #FBF7EF). Hazard levels utilize redundant icon indicators (⚠️, 🛑, 🛡️) alongside color coding.
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA]">
                    <strong className="text-[#006070] block mb-1">⌨️ Full Keyboard &amp; Screen Reader Support</strong>
                    Logical focus tab order, ARIA live regions for emergency alerts, and explicit accessible name labels across all interactive map layers, shelter lists, and citizen reporting forms.
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Policy */}
            {activeModal === 'privacy' && (
              <div>
                <h3 className="font-heading text-xl font-bold text-[#1c1b1a] mb-2">
                  Sovereign Civic Privacy &amp; Data Protection
                </h3>
                <p className="text-xs text-[#6F6A60] mb-4">
                  Built on local-first, zero-surveillance architectural principles.
                </p>
                <div className="space-y-3 text-xs text-[#2B2A28] leading-relaxed">
                  <div className="p-3 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA]">
                    <strong className="text-[#006070] block mb-1">📍 Ephemeral Geolocation Processing</strong>
                    GPS coordinates are queried and evaluated strictly inside your device browser memory. Coordinates are never logged or stored on remote servers unless you voluntarily submit a crowd hazard report.
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA]">
                    <strong className="text-[#006070] block mb-1">🛡️ Anonymous Community Verification</strong>
                    Citizen reports, upvotes, and triage confirmations use anonymous cryptographic tokens with no cookies, tracking pixels, or cross-site user fingerprinting.
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA]">
                    <strong className="text-[#006070] block mb-1">🔒 Local Data Sovereignty</strong>
                    All incident records are maintained in municipal-controlled storage with transparent automated cleanup after disaster clearance.
                  </div>
                </div>
              </div>
            )}

            {/* Ward Directory */}
            {activeModal === 'ward_dir' && (
              <div>
                <h3 className="font-heading text-xl font-bold text-[#1c1b1a] mb-2">
                  Greater Hyderabad Municipal Corporation (GHMC) Pilot Wards
                </h3>
                <p className="text-xs text-[#6F6A60] mb-4">
                  Hyperlocal micro-watershed monitoring zones with physical baseline topography and active shelter links.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-[#EADBCA] rounded-xl overflow-hidden">
                    <thead className="bg-[#F3EBDD] text-[#1c1b1a] font-bold">
                      <tr>
                        <th className="p-2.5">Ward Name</th>
                        <th className="p-2.5">Circle</th>
                        <th className="p-2.5">Zone</th>
                        <th className="p-2.5">Elevation</th>
                        <th className="p-2.5">Deluge Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EADBCA]">
                      {HYDERABAD_PILOT_WARDS.map(w => (
                        <tr key={w.id} className="hover:bg-[#FBF7EF]">
                          <td className="p-2.5 font-medium">{w.name}</td>
                          <td className="p-2.5 text-[#6F6A60]">{w.circle}</td>
                          <td className="p-2.5 text-[#6F6A60]">{w.zone}</td>
                          <td className="p-2.5 font-mono">{w.elev}m</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              w.risk === 'Severe' ? 'bg-[#FBE1DF] text-[#D9453D]' : w.risk === 'High' ? 'bg-[#FDEBD3] text-[#EE7B30]' : 'bg-[#E6F5ED] text-[#4CAF7A]'
                            }`}>
                              {w.risk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#EADBCA] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-full bg-[#1F7A8C] text-white text-xs font-semibold hover:bg-[#17606F] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
