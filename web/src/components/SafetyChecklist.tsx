'use client';

import React, { useState } from 'react';
import { CheckSquare, Square, Volume2, ShieldCheck, PhoneCall, AlertCircle, Sparkles } from 'lucide-react';
import { UserPersona } from '../types';

interface SafetyChecklistProps {
  wardName: string;
  persona: UserPersona;
  onPersonaChange: (p: UserPersona) => void;
  onSafeClick: () => void;
  onSosClick: () => void;
}

export const SafetyChecklist: React.FC<SafetyChecklistProps> = ({
  wardName,
  persona,
  onPersonaChange,
  onSafeClick,
  onSosClick
}) => {
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [speaking, setSpeaking] = useState(false);

  const getChecklistForPersona = () => {
    switch (persona) {
      case 'low_lying':
        return [
          { id: 1, text: 'Flip main ground-floor electrical circuit breaker off immediately.' },
          { id: 2, text: 'Move medicines, mobile chargers, and ID papers to upper floor or high shelves.' },
          { id: 3, text: 'Activate bilge sump pumps and check drain check-valves are not backflowing.' },
          { id: 4, text: 'Walk via elevated military road to Nadeem High School shelter if water reaches step.' }
        ];
      case 'outdoor_worker':
        return [
          { id: 1, text: 'Suspend direct physical outdoor labor between 12:00 PM and 04:00 PM.' },
          { id: 2, text: 'Drink coconut water or ORS packets every 30 minutes; do not wait for thirst.' },
          { id: 3, text: 'Rest in nearest public cooling center (Charminar Govt School Cooling Camp).' },
          { id: 4, text: 'Report any sudden dizziness, blurred vision, or cessation of sweat to 108.' }
        ];
      case 'elderly':
        return [
          { id: 1, text: 'Keep family emergency contacts and 108 speed-dial by the bedside.' },
          { id: 2, text: 'Rest in a well-ventilated, shaded room with damp cotton curtains.' },
          { id: 3, text: 'Ensure 3 days of chronic medications and purified water jars are reachable.' },
          { id: 4, text: 'Request volunteer assistance for essential groceries or medical transit.' }
        ];
      case 'general':
      default:
        return [
          { id: 1, text: 'Charge mobile phones and power banks to 100%.' },
          { id: 2, text: 'Store 10 liters of filtered drinking water in sealed containers.' },
          { id: 3, text: 'Avoid driving vehicles into waterlogged underpasses or nala embankments.' },
          { id: 4, text: 'Check in on elderly or disabled neighbors on your street block.' }
        ];
    }
  };

  const items = getChecklistForPersona();

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
      const textToRead = items.map((it, i) => `Step ${i + 1}: ${it.text}`).join('. ');
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
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
            ACTIONABLE CIVIC PROTOCOL
          </span>
          <h3 className="font-heading text-xl lg:text-2xl font-bold text-[#1c1b1a]">
            What To Do Right Now ({wardName})
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
          <span>{speaking ? 'Stop Audio' : '🔊 Listen Action Guide'}</span>
        </button>
      </div>

      {/* Persona Selector Chips */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-[#6F6A60] mb-2 uppercase tracking-wider">
          Tailor guidance to your profile:
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'low_lying', label: '🏠 Low-Lying Ground Home' },
            { id: 'outdoor_worker', label: '🔨 Outdoor Worker' },
            { id: 'elderly', label: '👴 Senior Citizen / Caregiver' },
            { id: 'general', label: '👥 General Resident' }
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
              {p.label}
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
            <span>I Am Safe</span>
          </button>
          <span className="text-xs text-[#6F6A60] hidden sm:inline">
            Notifies family &amp; ward marshal
          </span>
        </div>

        <button
          onClick={onSosClick}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#EE7B30] text-white hover:bg-[#d9671e] text-xs font-bold transition-all shadow-level1 cursor-pointer"
        >
          <PhoneCall className="w-4 h-4" />
          <span>SOS / Need Rescue</span>
        </button>
      </div>
    </div>
  );
};
