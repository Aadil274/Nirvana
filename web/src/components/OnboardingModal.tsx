'use client';

import React, { useState } from 'react';
import { SupportedLanguage, UserPersona } from '../types';
import { LANGUAGES } from '../lib/i18n';
import { Shield, MapPin, User, Bell, Check, ArrowRight } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
    language: SupportedLanguage;
    wardId: string;
    persona: UserPersona;
    phone: string;
  }) => void;
  wards: { id: string; name: string }[];
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  wards
}) => {
  const [step, setStep] = useState(1);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('en');
  const [selectedWard, setSelectedWard] = useState<string>('ward-72');
  const [selectedPersona, setSelectedPersona] = useState<UserPersona>('low_lying');
  const [phone, setPhone] = useState('9876543210');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVal, setOtpVal] = useState('421072');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const WARD_CENTROIDS: Record<string, [number, number]> = {
    'ward-72': [17.3820, 78.4230],
    'ward-71': [17.4014, 78.4118],
    'ward-48': [17.3616, 78.4747],
    'ward-55': [17.3730, 78.5095],
    'ward-8': [17.4440, 78.4680],
    'ward-62': [17.3980, 78.5150],
    'ward-44': [17.3200, 78.4800],
    'ward-10': [17.4050, 78.5580],
    'ward-91': [17.4120, 78.4600],
  };

  const handleGpsDetection = () => {
    if (typeof window === 'undefined' || !navigator || !('geolocation' in navigator)) {
      setGpsError('Browser geolocation is not supported on this device.');
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);

    const onPosSuccess = (pos: GeolocationPosition) => {
      setIsDetectingGps(false);
      setGpsError(null);
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      let nearestWardId = 'ward-72';
      let minDistance = Infinity;

      for (const [wid, [wLat, wLng]] of Object.entries(WARD_CENTROIDS)) {
        const d = Math.sqrt(((lat - wLat) * 111.0) ** 2 + ((lng - wLng) * 105.0) ** 2);
        if (d < minDistance) {
          minDistance = d;
          nearestWardId = wid;
        }
      }

      setSelectedWard(nearestWardId);
    };

    navigator.geolocation.getCurrentPosition(
      onPosSuccess,
      (err1) => {
        if (err1.code === 1) {
          setIsDetectingGps(false);
          setGpsError('Location permission denied. Please select your ward manually below.');
          return;
        }
        navigator.geolocation.getCurrentPosition(
          onPosSuccess,
          (err2) => {
            setIsDetectingGps(false);
            if (err2.code === 1) {
              setGpsError('Location permission denied. Please select your ward manually.');
            } else if (err2.code === 3) {
              setGpsError('Location timed out. Please retry or select your ward from the list.');
            } else {
              setGpsError('Could not determine position. Please select your ward manually.');
            }
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 3) {
      setOtpSent(true);
      setStep(4);
    } else if (step === 4) {
      onComplete({
        language: selectedLang,
        wardId: selectedWard,
        persona: selectedPersona,
        phone
      });
      onClose();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-modal border border-[#EADBCA] max-w-lg w-full p-6 sm:p-8 shadow-level3">
        {/* Wizard Stepper Dots */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EADBCA]">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#1F7A8C] text-white flex items-center justify-center text-xs font-bold">
              {step}/4
            </span>
            <span className="font-heading font-bold text-sm text-[#1c1b1a]">
              {step === 1 && 'Step 1: Choose Your Language'}
              {step === 2 && 'Step 2: Select Monitored Neighborhood'}
              {step === 3 && 'Step 3: Personalize Risk Profile'}
              {step === 4 && 'Step 4: Connect Alert Channels'}
            </span>
          </div>

          <button onClick={onClose} className="text-[#6F6A60] hover:text-[#1c1b1a] text-sm font-bold">
            Skip
          </button>
        </div>

        {/* STEP 1: LANGUAGE */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-[#6F6A60]">
              Nirvana provides localized voice bulletins and emergency text alerts in all major regional Indian languages.
            </p>
            <div className="grid grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`p-3 rounded-2xl text-center border transition-all ${
                    selectedLang === lang.code
                      ? 'bg-[#E3F1F4] border-[#1F7A8C] text-[#006070] font-bold shadow-sm'
                      : 'bg-[#FBF7EF] border-[#EADBCA] text-[#2B2A28] hover:bg-[#F3EBDD]'
                  }`}
                >
                  <span className="block text-sm">{lang.nativeName}</span>
                  <span className="text-[10px] text-[#6F6A60]">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-[#6F6A60]">
              Select your ward in Hyderabad to receive street-specific flood depth and cooling center notices.
            </p>

            {/* GPS Detection Button in Onboarding */}
            <button
              type="button"
              onClick={handleGpsDetection}
              disabled={isDetectingGps}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F3EBDD] hover:bg-[#EADBCA] text-[#006070] text-xs font-bold flex items-center justify-center gap-2 border border-[#1F7A8C]/30 transition-all cursor-pointer disabled:opacity-60"
            >
              <MapPin className={`w-4 h-4 text-[#1F7A8C] ${isDetectingGps ? 'animate-spin' : ''}`} />
              <span>{isDetectingGps ? 'Detecting device GPS...' : 'Use My Live GPS Location'}</span>
            </button>

            {gpsError && (
              <p className="text-[11px] text-[#D9453D] bg-[#FBE1DF] p-2 rounded-lg border border-[#D9453D]/30">
                {gpsError}
              </p>
            )}

            <div className="space-y-2 max-h-56 overflow-y-auto p-1">
              {wards.map(w => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWard(w.id)}
                  className={`w-full p-3 rounded-xl text-left border flex items-center justify-between text-xs transition-all ${
                    selectedWard === w.id
                      ? 'bg-[#E3F1F4] border-[#1F7A8C] text-[#006070] font-bold'
                      : 'bg-white border-[#EADBCA] text-[#2B2A28] hover:bg-[#F3EBDD]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#1F7A8C]" />
                    {w.name}
                  </span>
                  {selectedWard === w.id && <Check className="w-4 h-4 text-[#1F7A8C]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: VULNERABILITY PROFILE */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-xs text-[#6F6A60]">
              Personalized guidance ensures you receive specific instructions for your situation:
            </p>
            {[
              { id: 'low_lying', title: '🏠 Low-Lying Ground Resident', desc: 'Receive evacuation timing and bilge pump notifications.' },
              { id: 'outdoor_worker', title: '🔨 Daily-Wage / Outdoor Worker', desc: 'Work-hour heat stroke warnings, free ORS & cooling stations.' },
              { id: 'elderly', title: '👴 Senior Citizen / Caregiver', desc: 'Pre-storm welfare alerts & automated emergency contacts.' },
              { id: 'general', title: '👥 General Urban Citizen', desc: 'Citywide weather forecasts & localized street inundation.' }
            ].map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPersona(p.id as UserPersona)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedPersona === p.id
                    ? 'bg-[#E3F1F4] border-[#1F7A8C]'
                    : 'bg-[#fdf9f5] border-[#EADBCA] hover:bg-[#F3EBDD]'
                }`}
              >
                <div className="font-bold text-xs text-[#1c1b1a]">{p.title}</div>
                <div className="text-[11px] text-[#6F6A60] mt-0.5">{p.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 4: ALERT CHANNELS & OTP */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-xs text-[#6F6A60]">
              We respect user quiet hours. Severe flood alerts bypass quiet hours to save lives.
            </p>
            <div>
              <label className="block text-xs font-semibold text-[#6F6A60] mb-1">
                Mobile Number (Phone OTP):
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADBCA] text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6F6A60] mb-1">
                Enter 6-Digit OTP:
              </label>
              <input
                type="text"
                value={otpVal}
                onChange={(e) => setOtpVal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADBCA] text-xs font-bold tracking-widest outline-none"
              />
              <span className="text-[10px] text-[#4CAF7A] mt-1 block">
                ✓ Test OTP automatically filled (421072)
              </span>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-[#EADBCA] flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-full border border-[#EADBCA] text-xs font-semibold text-[#6F6A60] hover:bg-[#F3EBDD]"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#1F7A8C] text-white text-xs font-bold hover:bg-[#17606F] transition-all shadow-sm"
          >
            <span>{step === 4 ? 'Confirm & Finish' : 'Next Step'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
