'use client';

import React, { useState } from 'react';
import { SupportedLanguage, Shelter } from '../types';
import { getTranslation } from '../lib/i18n';
import {
  PhoneCall,
  Share2,
  Navigation,
  AlertOctagon,
  X,
  MapPin,
  Ambulance,
  Building,
  Check,
  Send
} from 'lucide-react';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
  nearestShelter?: Shelter | null;
  userCoords?: { lat: number; lng: number; label?: string } | null;
  wardName: string;
  onNavigateShelters: () => void;
  onRequestHelp: () => void;
}

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  nearestShelter,
  userCoords,
  wardName,
  onNavigateShelters,
  onRequestHelp,
}) => {
  const [copiedLocation, setCopiedLocation] = useState(false);
  const [helpRequestSent, setHelpRequestSent] = useState(false);

  if (!isOpen) return null;

  const handleShareLocation = async () => {
    const lat = userCoords?.lat || 17.3820;
    const lng = userCoords?.lng || 78.4230;
    const shareText = `EMERGENCY ALERT: I am in ${wardName} (Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}). Maps link: https://maps.google.com/?q=${lat},${lng}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nirvana Emergency SOS Location',
          text: shareText,
          url: `https://maps.google.com/?q=${lat},${lng}`,
        });
        return;
      } catch (err) {
        // User cancelled or fallback
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedLocation(true);
      setTimeout(() => setCopiedLocation(false), 3000);
    } catch {
      alert(shareText);
    }
  };

  const handleSendHelp = () => {
    setHelpRequestSent(true);
    onRequestHelp();
    setTimeout(() => {
      setHelpRequestSent(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-modal border border-[#EADBCA] p-6 shadow-level3 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sos-title"
      >
        {/* Header with SOS Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EADBCA] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FBE1DF] flex items-center justify-center text-[#D9453D] shadow-sm">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 id="sos-title" className="font-heading font-extrabold text-xl text-[#1c1b1a]">
                Emergency SOS & Relief
              </h3>
              <p className="text-xs text-[#6F6A60]">
                Active Ward: <strong className="text-[#1c1b1a]">{wardName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F3EBDD] hover:bg-[#EADBCA] flex items-center justify-center text-sm font-bold cursor-pointer"
            aria-label="Close SOS Sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rapid Emergency Hotlines */}
        <div className="space-y-3 mb-6">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6F6A60]">
            Direct Emergency Dialers
          </label>

          {/* 112 National Helpline */}
          <a
            href="tel:112"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#D9453D] text-white hover:bg-[#b8322b] transition-all shadow-level1 font-semibold text-sm group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="block font-bold">Call 112 Emergency</span>
                <span className="text-[11px] text-white/80">Police • Fire • SDRF First Responders</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/20 font-bold">Dial</span>
          </a>

          {/* 108 Ambulance */}
          <a
            href="tel:108"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FDEBD3] text-[#914d00] hover:bg-[#fbdcb2] transition-all border border-[#EE7B30]/30 font-semibold text-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#fc9430]/20 flex items-center justify-center text-[#914d00]">
                <Ambulance className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-bold">Call 108 Ambulance</span>
                <span className="text-[11px] text-[#6F6A60]">Medical triage & emergency paramedic transport</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white font-bold text-[#914d00] border border-[#EE7B30]/30">Dial</span>
          </a>

          {/* GHMC Disaster Control Room */}
          <a
            href="tel:04021111111"
            className="flex items-center justify-between p-3 rounded-2xl bg-[#FBF7EF] text-[#1c1b1a] hover:bg-[#F3EBDD] transition-all border border-[#EADBCA] text-xs font-semibold"
          >
            <div className="flex items-center gap-2.5">
              <Building className="w-4 h-4 text-[#1F7A8C]" />
              <div className="text-left">
                <span className="block font-bold">GHMC Flood Control Room</span>
                <span className="text-[10px] text-[#6F6A60]">040-21111111 • De-watering & rescue</span>
              </div>
            </div>
            <span className="text-[11px] text-[#1F7A8C] font-bold">Call</span>
          </a>
        </div>

        {/* Live Location & Shelter Quick Actions */}
        <div className="space-y-3 mb-6">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6F6A60]">
            Ground Actions
          </label>

          {/* Share Live Location */}
          <button
            type="button"
            onClick={handleShareLocation}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#E3F1F4] text-[#006070] hover:bg-[#d0ecf1] transition-all border border-[#1F7A8C]/30 text-xs font-semibold cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left">
              <Share2 className="w-4 h-4 text-[#1F7A8C] shrink-0" />
              <div>
                <span className="block font-bold">Share My Live Location</span>
                <span className="text-[10px] text-[#3f484b]">
                  {userCoords ? `GPS: ${userCoords.lat.toFixed(4)}°, ${userCoords.lng.toFixed(4)}°` : `Locality: ${wardName}`}
                </span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white font-bold text-[#006070]">
              {copiedLocation ? 'Copied Link!' : 'Share'}
            </span>
          </button>

          {/* Nearest Shelter Locator */}
          {nearestShelter && (
            <div className="p-3.5 rounded-2xl bg-white border border-[#EADBCA] text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase text-[#4CAF7A]">Nearest Safe Haven</span>
                <span className="text-xs font-bold text-[#1F7A8C]">
                  {nearestShelter.distance_km} km ({nearestShelter.walking_mins}m walk)
                </span>
              </div>
              <h4 className="font-heading font-bold text-sm text-[#1c1b1a]">{nearestShelter.name}</h4>
              <p className="text-[11px] text-[#6F6A60] line-clamp-1 mb-2">{nearestShelter.address}</p>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${nearestShelter.contact}`}
                  className="flex-1 text-center py-1.5 rounded-full bg-[#F3EBDD] hover:bg-[#EADBCA] text-[#1c1b1a] text-xs font-semibold"
                >
                  Call Shelter
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateShelters();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-full bg-[#1F7A8C] hover:bg-[#17606F] text-white text-xs font-semibold cursor-pointer"
                >
                  <Navigation className="w-3 h-3" />
                  <span>View Map</span>
                </button>
              </div>
            </div>
          )}

          {/* Broadcast Urgent Help Request */}
          <button
            type="button"
            onClick={handleSendHelp}
            disabled={helpRequestSent}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#EE7B30] hover:bg-[#d9671e] text-white text-xs font-bold transition-all shadow-level1 cursor-pointer disabled:opacity-75"
          >
            {helpRequestSent ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Help Request Broadcast to Ward Team!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-white" />
                <span>Broadcast Help Request to GHMC Team</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-center text-[#6F6A60]">
          In life-threatening situations, prioritize calling <strong>112</strong> immediately.
        </p>
      </div>
    </div>
  );
};
