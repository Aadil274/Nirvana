'use client';

import React, { useState } from 'react';
import { Shelter } from '../types';
import { Home, Phone, Navigation, CheckCircle2, AlertTriangle, ShieldCheck, Filter } from 'lucide-react';

interface ShelterLocatorProps {
  shelters: Shelter[];
  onCallShelter: (phone: string) => void;
}

export const ShelterLocator: React.FC<ShelterLocatorProps> = ({
  shelters,
  onCallShelter
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
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#4CAF7A]">
            VERIFIED SAFE HAVENS &amp; COOLING CENTERS
          </span>
          <h3 className="font-heading text-xl lg:text-2xl font-bold text-[#1c1b1a]">
            Nearby Verified Relief Shelters
          </h3>
          <p className="text-xs text-[#6F6A60] mt-0.5">
            Geospatially routed outside flood-choked underpasses with capacity and facility tracking.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              verifiedOnly
                ? 'bg-[#E6F5ED] text-[#4CAF7A] border-[#4CAF7A]'
                : 'bg-white text-[#6F6A60] border-[#EADBCA]'
            }`}
          >
            Verified Only
          </button>
          {[
            { id: 'all', label: 'All Shelters' },
            { id: 'power_backup', label: '⚡ Power Backup' },
            { id: 'medical_aid', label: '🩺 Medical Aid' },
            { id: 'women_safe_area', label: '🛡️ Women-Safe Wing' },
            { id: 'pet_friendly', label: '🐾 Pet Friendly' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterFacility(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filterFacility === f.id
                  ? 'bg-[#E3F1F4] text-[#006070] border-[#1F7A8C]'
                  : 'bg-white text-[#6F6A60] border-[#EADBCA] hover:bg-[#F3EBDD]'
              }`}
            >
              {f.label}
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
              className="tactile-card p-5 flex flex-col justify-between border border-[#EADBCA] rounded-2xl bg-white"
            >
              <div>
                {/* Verification badge */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isVerified
                        ? 'bg-[#E6F5ED] text-[#4CAF7A]'
                        : 'bg-[#F3EBDD] text-[#6F6A60]'
                    }`}
                  >
                    {isVerified ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-[#EE7B30]" />
                    )}
                    {shelter.verification_status}
                  </span>

                  <span className="text-xs font-bold text-[#1F7A8C]">
                    {shelter.distance_km} km ({shelter.walking_mins} min walk)
                  </span>
                </div>

                <h4 className="font-heading font-bold text-base text-[#1c1b1a] mb-1">
                  {shelter.name}
                </h4>
                <p className="text-xs text-[#6F6A60] mb-3 line-clamp-2">
                  {shelter.address}
                </p>

                {/* Capacity Bar */}
                <div className="mb-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6F6A60]">Occupancy</span>
                    <span className="font-semibold text-[#1c1b1a]">
                      {shelter.current_occupancy} / {shelter.capacity} beds ({occupancyPct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#F3EBDD] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${occupancyPct}%`,
                        backgroundColor: occupancyPct > 80 ? '#D9453D' : '#4CAF7A'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Facilities Pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {shelter.facilities.drinking_water && (
                    <span className="px-2 py-0.5 rounded-full bg-[#F3EBDD] text-[10px] text-[#2B2A28]">
                      💧 Filtered Water
                    </span>
                  )}
                  {shelter.facilities.power_backup && (
                    <span className="px-2 py-0.5 rounded-full bg-[#F3EBDD] text-[10px] text-[#2B2A28]">
                      ⚡ Generator
                    </span>
                  )}
                  {shelter.facilities.medical_aid && (
                    <span className="px-2 py-0.5 rounded-full bg-[#F3EBDD] text-[10px] text-[#2B2A28]">
                      🩺 Nurse on duty
                    </span>
                  )}
                  {shelter.facilities.women_safe_area && (
                    <span className="px-2 py-0.5 rounded-full bg-[#F3EBDD] text-[10px] text-[#2B2A28]">
                      🛡️ Safe Wing
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#EADBCA] flex items-center justify-between gap-2">
                <a
                  href={`tel:${shelter.contact}`}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-full bg-[#F3EBDD] hover:bg-[#EADBCA] text-[#1c1b1a] text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#1F7A8C]" />
                  <span>Call Shelter</span>
                </a>
                <button
                  onClick={() => alert(`Navigation hint: Follow higher ground exit route via Military Road to avoid flooded low-lying culverts at ${shelter.name}.`)}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-full bg-[#1F7A8C] hover:bg-[#17606F] text-white text-xs font-semibold transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Directions</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
