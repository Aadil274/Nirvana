'use client';

import React, { useState } from 'react';
import { Shelter, SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';
import { Phone, Navigation, CheckCircle2, AlertTriangle, Users, Droplets, Zap, Shield, Heart } from 'lucide-react';

interface ShelterLocatorProps {
  shelters: Shelter[];
  onCallShelter: (phone: string) => void;
  currentLang: SupportedLanguage;
}

export const ShelterLocator: React.FC<ShelterLocatorProps> = ({
  shelters,
  onCallShelter,
  currentLang
}) => {
  const [filterFacility, setFilterFacility] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filtered = shelters.filter(s => {
    if (verifiedOnly && !s.verification_status.includes('Verified')) return false;
    if (filterFacility === 'all') return true;
    return s.facilities[filterFacility as keyof typeof s.facilities];
  });

  return (
    <div className="w-full bg-[#FFFFFF] rounded-card border border-[#EADBCA] p-6 lg:p-8 shadow-level1" id="verified-shelters">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-[#EADBCA]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#4CAF7A] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {getTranslation(currentLang, 'shelters_tag')}
          </span>
          <h3 className="font-heading text-xl lg:text-2xl font-bold text-[#1c1b1a]">
            {getTranslation(currentLang, 'shelters_title')}
          </h3>
          <p className="text-xs text-[#6F6A60] mt-0.5">
            {getTranslation(currentLang, 'shelters_subtitle')}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
              verifiedOnly
                ? 'bg-[#E6F5ED] text-[#4CAF7A] border-[#4CAF7A] shadow-sm'
                : 'bg-white text-[#6F6A60] border-[#EADBCA] hover:bg-[#F3EBDD]'
            }`}
          >
            {getTranslation(currentLang, 'filter_verified')}
          </button>
          {[
            { id: 'all', labelKey: 'filter_all' },
            { id: 'power_backup', labelKey: 'filter_power' },
            { id: 'medical_aid', labelKey: 'filter_medical' },
            { id: 'women_safe_area', labelKey: 'filter_women' },
            { id: 'pet_friendly', labelKey: 'filter_pet' }
          ].map(f => (
            <button
              type="button"
              key={f.id}
              onClick={() => setFilterFacility(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                filterFacility === f.id
                  ? 'bg-[#E3F1F4] text-[#006070] border-[#1F7A8C] shadow-sm font-bold'
                  : 'bg-white text-[#6F6A60] border-[#EADBCA] hover:bg-[#F3EBDD]'
              }`}
            >
              {getTranslation(currentLang, f.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Shelters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {filtered.map(shelter => {
          const occupancyPct = Math.round((shelter.current_occupancy / shelter.capacity) * 100);
          const isVerified = shelter.verification_status.includes('Verified');

          return (
            <div
              key={shelter.id}
              className="tactile-card p-5 flex flex-col justify-between border border-[#EADBCA] rounded-2xl bg-white transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isVerified
                        ? 'bg-[#E6F5ED] text-[#4CAF7A] border border-[#4CAF7A]/30'
                        : 'bg-[#F3EBDD] text-[#6F6A60] border border-[#EADBCA]'
                    }`}
                  >
                    {isVerified ? (
                      <CheckCircle2 className="w-3 h-3 text-[#4CAF7A]" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-[#EE7B30]" />
                    )}
                    {isVerified ? getTranslation(currentLang, 'verified_by_muni') : getTranslation(currentLang, 'unverified')}
                  </span>

                  <span className="text-xs font-bold text-[#1F7A8C] bg-[#E3F1F4] px-2 py-0.5 rounded-full">
                    {shelter.distance_km} km ({shelter.walking_mins} min walk)
                  </span>
                </div>

                <h4 className="font-heading font-bold text-base text-[#1c1b1a] mb-1">
                  {shelter.name}
                </h4>
                <p className="text-xs text-[#6F6A60] mb-3 line-clamp-2">
                  {shelter.address}
                </p>

                {/* Capacity Progress Bar with Percentage Fill */}
                <div className="mb-3.5 space-y-1.5 p-2.5 rounded-xl bg-[#FBF7EF] border border-[#EADBCA]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6F6A60] flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#1F7A8C]" />
                      {getTranslation(currentLang, 'occupancy_label')}
                    </span>
                    <span className="font-semibold text-[#1c1b1a]">
                      <strong>{shelter.current_occupancy}</strong> / {shelter.capacity} beds ({occupancyPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EADBCA] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${occupancyPct}%`,
                        backgroundColor: occupancyPct > 85 ? '#D9453D' : occupancyPct > 60 ? '#F2B134' : '#4CAF7A'
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#6F6A60]">
                    <span>Available: {shelter.capacity - shelter.current_occupancy} beds</span>
                    <span className={occupancyPct > 85 ? 'text-[#D9453D] font-bold' : 'text-[#4CAF7A] font-bold'}>
                      {occupancyPct > 85 ? 'Near Capacity' : 'Space Available'}
                    </span>
                  </div>
                </div>

                {/* Facilities Pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {shelter.facilities.drinking_water && (
                    <span className="px-2 py-0.5 rounded-full bg-[#E3F1F4] text-[#006070] text-[10px] font-semibold border border-[#1F7A8C]/20">
                      💧 Water & Rations
                    </span>
                  )}
                  {shelter.facilities.power_backup && (
                    <span className="px-2 py-0.5 rounded-full bg-[#FDEBD3] text-[#914d00] text-[10px] font-semibold border border-[#EE7B30]/20">
                      ⚡ Power Generator
                    </span>
                  )}
                  {shelter.facilities.medical_aid && (
                    <span className="px-2 py-0.5 rounded-full bg-[#E6F5ED] text-[#4CAF7A] text-[10px] font-semibold border border-[#4CAF7A]/20">
                      🩺 Paramedic Triage
                    </span>
                  )}
                  {shelter.facilities.women_safe_area && (
                    <span className="px-2 py-0.5 rounded-full bg-[#FBE1DF] text-[#D9453D] text-[10px] font-semibold border border-[#D9453D]/20">
                      🛡️ Women & Child Safe Dorm
                    </span>
                  )}
                  {shelter.facilities.pet_friendly && (
                    <span className="px-2 py-0.5 rounded-full bg-[#F3EBDD] text-[#2B2A28] text-[10px] font-semibold border border-[#EADBCA]">
                      🐾 Pet Friendly
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#EADBCA] flex items-center justify-between gap-2">
                <a
                  href={`tel:${shelter.contact}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#F3EBDD] hover:bg-[#EADBCA] text-[#1c1b1a] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-[#1F7A8C]" />
                  <span>{getTranslation(currentLang, 'call_shelter')}</span>
                </a>
                <button
                  type="button"
                  onClick={() => alert(`Navigation Route: Follow higher ground corridor via Military Road toward ${shelter.name}. Avoid low-lying Nadeem Colony culverts.`)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#1F7A8C] hover:bg-[#17606F] text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{getTranslation(currentLang, 'directions')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
