'use client';

import React, { useState } from 'react';
import { CheckSquare, Square, Volume2, ShieldCheck, PhoneCall, CheckCircle, Sparkles } from 'lucide-react';
import { UserPersona, SupportedLanguage } from '../types';
import { getTranslation, getLocalizedChecklist } from '../lib/i18n';

interface SafetyChecklistProps {
  wardName: string;
  persona: UserPersona;
  onPersonaChange: (p: UserPersona) => void;
  onSafeClick: () => void;
  onSosClick: () => void;
  currentLang: SupportedLanguage;
  isSafe?: boolean;
  safeTimestamp?: string | null;
  onUndoSafe?: () => void;
}

export const SafetyChecklist: React.FC<SafetyChecklistProps> = ({
  wardName,
  persona,
  onPersonaChange,
  onSafeClick,
  onSosClick,
  currentLang,
  isSafe = false,
  safeTimestamp = null,
  onUndoSafe
}) => {
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [speaking, setSpeaking] = useState(false);

  const items = getLocalizedChecklist(currentLang, persona);
  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

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
    <div className="w-full bg-[#FFFFFF] rounded-card border border-[#EADBCA] p-6 lg:p-8 shadow-level1 tactile-card-static" id="safety-guides-section">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#EADBCA]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#EE7B30] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {getTranslation(currentLang, 'actionable_protocol_tag')}
          </span>
          <h3 className="font-heading text-xl lg:text-2xl font-bold text-[#1c1b1a]">
            {getTranslation(currentLang, 'what_to_do_now')} ({wardName})
          </h3>
        </div>

        {/* Audio "Listen" Button with Animated Waveform */}
        <button
          type="button"
          onClick={handleSpeech}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
            speaking
              ? 'bg-[#1F7A8C] text-white border-[#1F7A8C] shadow-sm'
              : 'bg-[#F3EBDD] text-[#1c1b1a] border-[#EADBCA] hover:bg-[#FDEBD3]'
          }`}
        >
          {speaking ? (
            <div className="flex items-center gap-1 h-3.5">
              <span className="audio-bar" style={{ animationDelay: '0s', backgroundColor: '#FFFFFF' }} />
              <span className="audio-bar" style={{ animationDelay: '0.2s', backgroundColor: '#FFFFFF' }} />
              <span className="audio-bar" style={{ animationDelay: '0.4s', backgroundColor: '#FFFFFF' }} />
            </div>
          ) : (
            <Volume2 className="w-4 h-4 text-[#006070]" />
          )}
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
              type="button"
              key={p.id}
              onClick={() => onPersonaChange(p.id as UserPersona)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                persona === p.id
                  ? 'bg-[#E3F1F4] text-[#006070] border-[#1F7A8C] shadow-sm font-bold'
                  : 'bg-white text-[#6F6A60] border-[#EADBCA] hover:bg-[#F3EBDD]'
              }`}
            >
              {getTranslation(currentLang, p.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Circular Progress & Action Completion Banner */}
      <div className="mb-5 p-3.5 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Circular SVG ring */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#EADBCA"
                strokeWidth="3.5"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#4CAF7A"
                strokeWidth="3.5"
                strokeDasharray={`${progressPct}, 100`}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-[#1c1b1a]">
              {progressPct}%
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-[#1c1b1a] block">
              {completedCount} of {items.length} Actions Completed
            </span>
            <span className="text-[11px] text-[#6F6A60]">
              {completedCount === items.length
                ? 'All contingency precautions verified!'
                : 'Follow each protocol step to minimize personal risk.'}
            </span>
          </div>
        </div>

        {completedCount === items.length && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E6F5ED] text-[#4CAF7A] border border-[#4CAF7A]/30 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Ready
          </span>
        )}
      </div>

      {/* Interactive Checkbox Items */}
      <div className="space-y-3 mb-8">
        {items.map(item => {
          const isDone = completed[item.id];
          return (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer transition-all border ${
                isDone
                  ? 'bg-[#E6F5ED] border-[#4CAF7A]/40 text-[#4CAF7A]'
                  : 'bg-[#fdf9f5] border-[#EADBCA] hover:bg-white hover:shadow-sm text-[#1c1b1a]'
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
          {isSafe ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E6F5ED] text-[#4CAF7A] border border-[#4CAF7A]/30 text-xs font-bold animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-[#4CAF7A]" />
              <span>Welfare Registered: Confirmed Safe {safeTimestamp ? `(${safeTimestamp})` : ''}</span>
              {onUndoSafe && (
                <button
                  type="button"
                  onClick={onUndoSafe}
                  className="ml-1 text-[11px] underline text-[#6F6A60] hover:text-[#D9453D] cursor-pointer"
                >
                  Undo
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onSafeClick}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#E6F5ED] text-[#4CAF7A] hover:bg-[#4CAF7A] hover:text-white text-xs font-bold transition-all border border-[#4CAF7A]/30 cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{getTranslation(currentLang, 'im_safe_btn')}</span>
              </button>
              <span className="text-xs text-[#6F6A60] hidden sm:inline">
                {getTranslation(currentLang, 'im_safe_desc')}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onSosClick}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#EE7B30] text-white hover:bg-[#d9671e] text-xs font-bold transition-all shadow-level1 cursor-pointer transform hover:scale-102 active:scale-98"
        >
          <PhoneCall className="w-4 h-4" />
          <span>{getTranslation(currentLang, 'sos_btn')}</span>
        </button>
      </div>
    </div>
  );
};
