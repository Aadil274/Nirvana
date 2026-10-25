'use client';

import React, { useState } from 'react';
import { CheckSquare, Square, Volume2, ShieldCheck, PhoneCall } from 'lucide-react';
import { UserPersona, SupportedLanguage } from '../types';
import { getTranslation, getLocalizedChecklist } from '../lib/i18n';

interface SafetyChecklistProps {
  wardName: string;
  persona: UserPersona;
  onPersonaChange: (p: UserPersona) => void;
  onSafeClick: () => void;
  onSosClick: () => void;
  currentLang: SupportedLanguage;
}

export const SafetyChecklist: React.FC<SafetyChecklistProps> = ({
  wardName,
  persona,
  onPersonaChange,
  onSafeClick,
  onSosClick,
  currentLang
}) => {
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [speaking, setSpeaking] = useState(false);

  const items = getLocalizedChecklist(currentLang, persona);

  const toggleCheck = (id: number) => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSpeech = () => {
    if ('speechSynthesis' in window) {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }
      const textToRead = items.map((it, i) => `${i + 1}. ${it.text}`).join('. ');
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.90;
      
      // Match Indian regional voice locale
      if (currentLang === 'te') utterance.lang = 'te-IN';
      else if (currentLang === 'hi') utterance.lang = 'hi-IN';
      else if (currentLang === 'ta') utterance.lang = 'ta-IN';
      else utterance.lang = 'en-IN';

      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported by your browser.');
    }
  };

  return (
    <div className="w-full bg-[#FFFFFF] rounded-card border border-[#EADBCA] p-6 lg:p-8 shadow-level1">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#EADBCA]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#EE7B30]">
            {getTranslation(currentLang, 'actionable_protocol_tag')}
          </span>
          <h3 className="font-heading text-xl lg:text-2xl font-bold text-[#1c1b1a]">
            {getTranslation(currentLang, 'what_to_do_now')} ({wardName})
          </h3>
        </div>

        {/* Audio "Listen" Button */}
        <button
          onClick={handleSpeech}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
            speaking
              ? 'bg-[#1F7A8C] text-white border-[#1F7A8C] shadow-sm animate-pulse'
              : 'bg-[#F3EBDD] text-[#1c1b1a] border-[#EADBCA] hover:bg-[#FDEBD3]'
          }`}
        >
          <Volume2 className="w-4 h-4 text-[#006070]" />
          <span>{speaking ? getTranslation(currentLang, 'stop_audio') : getTranslation(currentLang, 'listen_action_guide')}</span>
        </button>
      </div>

      {/* Persona Selector Chips */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-[#6F6A60] mb-2 uppercase tracking-wider">
          {getTranslation(currentLang, 'tailor_profile_label')}
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'low_lying', labelKey: 'persona_low_lying' },
            { id: 'outdoor_worker', labelKey: 'persona_outdoor_worker' },
            { id: 'elderly', labelKey: 'persona_elderly' },
            { id: 'general', labelKey: 'persona_general' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => onPersonaChange(p.id as UserPersona)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                persona === p.id
                  ? 'bg-[#E3F1F4] text-[#006070] border-[#1F7A8C]'
                  : 'bg-white text-[#6F6A60] border-[#EADBCA] hover:bg-[#F3EBDD]'
              }`}
            >
              {getTranslation(currentLang, p.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Checkbox Items */}
      <div className="space-y-3 mb-8">
        {items.map(item => {
          const isDone = completed[item.id];
          return (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all border ${
                isDone
                  ? 'bg-[#E6F5ED] border-[#4CAF7A]/40 text-[#4CAF7A]'
                  : 'bg-[#fdf9f5] border-[#EADBCA] hover:bg-[#F3EBDD]/50 text-[#1c1b1a]'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckSquare className="w-5 h-5 text-[#4CAF7A]" />
                ) : (
                  <Square className="w-5 h-5 text-[#6F6A60]" />
                )}
              </div>
              <span className={`text-sm font-medium leading-relaxed ${isDone ? 'line-through text-[#6F6A60]' : ''}`}>
                {item.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Emergency Status Actions ("I'm Safe" and "SOS") */}
      <div className="pt-6 border-t border-[#EADBCA] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onSafeClick}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#E6F5ED] text-[#4CAF7A] hover:bg-[#4CAF7A] hover:text-white text-xs font-bold transition-all border border-[#4CAF7A]/30 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{getTranslation(currentLang, 'im_safe_btn')}</span>
          </button>
          <span className="text-xs text-[#6F6A60] hidden sm:inline">
            {getTranslation(currentLang, 'im_safe_desc')}
          </span>
        </div>

        <button
          onClick={onSosClick}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#EE7B30] text-white hover:bg-[#d9671e] text-xs font-bold transition-all shadow-level1 cursor-pointer"
        >
          <PhoneCall className="w-4 h-4" />
          <span>{getTranslation(currentLang, 'sos_btn')}</span>
        </button>
      </div>
    </div>
  );
};
