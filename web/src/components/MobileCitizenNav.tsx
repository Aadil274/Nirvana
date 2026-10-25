'use client';

import React from 'react';
import { Home, Map, ShieldCheck, HeartHandshake, User, AlertTriangle } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';

interface MobileCitizenNavProps {
  currentLang: SupportedLanguage;
  onOpenSos: () => void;
  onOpenProfile: () => void;
  activeTab?: string;
}

export const MobileCitizenNav: React.FC<MobileCitizenNavProps> = ({
  currentLang,
  onOpenSos,
  onOpenProfile,
  activeTab = 'home',
}) => {
  const scrollTo = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <aside
      className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/95 backdrop-blur-md border border-[#EADBCA] rounded-full px-2 py-1.5 shadow-level3 flex items-center justify-between"
      aria-label="Mobile citizen navigation"
    >
      {/* 1. Home */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="flex-1 flex flex-col items-center justify-center py-1 text-[#6F6A60] hover:text-[#006070] transition-colors cursor-pointer"
        aria-label="Home"
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5">Home</span>
      </button>

      {/* 2. Map */}
      <button
        type="button"
        onClick={() => scrollTo('live-risk-map')}
        className="flex-1 flex flex-col items-center justify-center py-1 text-[#6F6A60] hover:text-[#006070] transition-colors cursor-pointer"
        aria-label="Risk Map"
      >
        <Map className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5">Map</span>
      </button>

      {/* 3. CENTRE PROMINENT SAFFRON SOS BUTTON */}
      <div className="relative -top-3 mx-1">
        <button
          type="button"
          onClick={onOpenSos}
          className="w-13 h-13 rounded-full bg-[#F28C28] text-white flex flex-col items-center justify-center shadow-lg hover:bg-[#d9671e] transition-all transform hover:scale-105 active:scale-95 saffron-sos-pulse cursor-pointer border-2 border-white"
          aria-label="Emergency SOS and Rescue Action"
        >
          <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
          <span className="text-[9px] font-black uppercase tracking-wider leading-none mt-0.5">SOS</span>
        </button>
      </div>

      {/* 4. Shelters */}
      <button
        type="button"
        onClick={() => scrollTo('verified-shelters')}
        className="flex-1 flex flex-col items-center justify-center py-1 text-[#6F6A60] hover:text-[#006070] transition-colors cursor-pointer"
        aria-label="Relief Shelters"
      >
        <HeartHandshake className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5">Shelters</span>
      </button>

      {/* 5. Me / Settings */}
      <button
        type="button"
        onClick={onOpenProfile}
        className="flex-1 flex flex-col items-center justify-center py-1 text-[#6F6A60] hover:text-[#006070] transition-colors cursor-pointer"
        aria-label="User Settings & Language Profile"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5">Me</span>
      </button>
    </aside>
  );
};
