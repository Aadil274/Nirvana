'use client';

import React, { useState } from 'react';
import { Volume2, PhoneCall, AlertTriangle, CheckCircle, ShieldCheck, ArrowRight, EyeOff } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';

interface SimpleModeViewProps {
  wardName: string;
  floodLevel: string;
  depthCm: number;
  nearestShelterName: string;
  nearestShelterContact: string;
  currentLang: SupportedLanguage;
  onExitSimpleMode: () => void;
}

export const SimpleModeView: React.FC<SimpleModeViewProps> = ({
  wardName,
  floodLevel,
  depthCm,
  nearestShelterName,
  nearestShelterContact,
  currentLang,
  onExitSimpleMode
}) => {
  const [speaking, setSpeaking] = useState(false);
  const isDanger = floodLevel === 'Severe' || floodLevel === 'High';

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }
      const message = isDanger
        ? `Warning! Flood danger in ${wardName}. Expected water depth is ${depthCm} centimeters. Go to ${nearestShelterName} immediately.`
        : `All normal in ${wardName}. Water levels are safe. Stay calm.`;

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.85;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7EF] p-4 sm:p-8 flex flex-col items-center justify-between font-heading">
      {/* Top Simple Header */}
      <div className="w-full max-w-2xl flex items-center justify-between pb-4 border-b-2 border-[#EADBCA]">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-[#006070]">Nirvana</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#EE7B30] text-white font-bold">
            SIMPLE MODE
          </span>
        </div>
        <button
          onClick={onExitSimpleMode}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border-2 border-[#EADBCA] text-xs font-bold text-[#1c1b1a] hover:bg-[#F3EBDD]"
        >
          <EyeOff className="w-4 h-4" />
          <span>Exit Simple View</span>
        </button>
      </div>

      {/* Main High-Contrast Giant Cards */}
      <div className="w-full max-w-2xl my-auto space-y-6">
        
        {/* Status Giant Card */}
        <div
          className={`p-8 rounded-3xl border-4 text-center ${
            isDanger
              ? 'bg-[#FBE1DF] border-[#D9453D] text-[#D9453D]'
              : 'bg-[#E6F5ED] border-[#4CAF7A] text-[#4CAF7A]'
          }`}
        >
          <div className="flex justify-center mb-3">
            {isDanger ? (
              <AlertTriangle className="w-20 h-20 text-[#D9453D] animate-bounce" />
            ) : (
              <CheckCircle className="w-20 h-20 text-[#4CAF7A]" />
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            {isDanger ? 'DANGER: EVACUATE NOW' : 'SAFE: STAY INDOORS'}
          </h1>
          <p className="text-xl font-bold text-[#1c1b1a] mb-1">
            {wardName}
          </p>
          <p className="text-lg text-[#6F6A60]">
            Expected Water Depth: <strong className="text-[#1c1b1a] text-2xl">{depthCm} cm</strong>
          </p>
        </div>

        {/* Audio "Listen Voice" Giant Button */}
        <button
          onClick={handleSpeak}
          className={`w-full py-5 rounded-3xl text-xl sm:text-2xl font-black flex items-center justify-center gap-3 shadow-level2 transition-all cursor-pointer ${
            speaking
              ? 'bg-[#006070] text-white animate-pulse'
              : 'bg-[#1F7A8C] hover:bg-[#17606F] text-white'
          }`}
        >
          <Volume2 className="w-8 h-8" />
          <span>{speaking ? 'STOP VOICE' : '🔊 LISTEN VOICE ADVISORY'}</span>
        </button>

        {/* Nearest Safe Shelter Giant Card */}
        <div className="p-6 rounded-3xl bg-white border-2 border-[#EADBCA] shadow-level1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4CAF7A] block mb-1">
            NEAREST SAFE HIGHER-GROUND SHELTER
          </span>
          <h2 className="text-2xl font-black text-[#1c1b1a] mb-2">
            {nearestShelterName}
          </h2>
          <p className="text-sm font-medium text-[#6F6A60] mb-4">
            Safe from floodwaters • Free water &amp; medical beds
          </p>

          <a
            href={`tel:${nearestShelterContact}`}
            className="w-full py-4 rounded-2xl bg-[#F3EBDD] hover:bg-[#EADBCA] text-[#1c1b1a] text-lg font-bold flex items-center justify-center gap-2 border border-[#EADBCA]"
          >
            <PhoneCall className="w-6 h-6 text-[#1F7A8C]" />
            <span>Call Shelter ({nearestShelterContact})</span>
          </a>
        </div>

        {/* Emergency Helplines (112 & 108) */}
        <div className="grid grid-cols-2 gap-4">
          <a
            href="tel:112"
            className="p-5 rounded-2xl bg-[#D9453D] hover:bg-[#b8332c] text-white text-center flex flex-col items-center justify-center shadow-sm"
          >
            <span className="text-xs uppercase font-bold tracking-wider">Police &amp; Fire</span>
            <span className="text-3xl font-black">112</span>
          </a>

          <a
            href="tel:108"
            className="p-5 rounded-2xl bg-[#EE7B30] hover:bg-[#d9671e] text-white text-center flex flex-col items-center justify-center shadow-sm"
          >
            <span className="text-xs uppercase font-bold tracking-wider">Ambulance</span>
            <span className="text-3xl font-black">108</span>
          </a>
        </div>

      </div>

      <div className="text-xs text-[#6F6A60] text-center pt-4">
        Nirvana Simple Mode • High contrast tactile design for senior citizens
      </div>
    </div>
  );
};
