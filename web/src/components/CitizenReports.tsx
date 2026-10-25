'use client';

import React, { useState } from 'react';
import { CitizenReport, RiskLevel, SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';
import { ThumbsUp, Camera, MapPin, Plus, Clock, Mic, Play, Pause, CheckCircle2, ShieldAlert } from 'lucide-react';

interface CitizenReportsProps {
  reports: CitizenReport[];
  onSubmitReport: (report: Partial<CitizenReport>) => void;
  onConfirmReport: (reportId: string) => void;
  currentWardName: string;
  currentLang: SupportedLanguage;
}

export const CitizenReports: React.FC<CitizenReportsProps> = ({
  reports,
  onSubmitReport,
  onConfirmReport,
  currentWardName,
  currentLang
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState<'waterlogging' | 'blocked_drain' | 'heat_stress' | 'power_cut'>('waterlogging');
  const [severity, setSeverity] = useState<RiskLevel>('Severe');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [hasPhoto, setHasPhoto] = useState(true);
  const [hasAudio, setHasAudio] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please add a short description of the ground situation.');
      return;
    }
    onSubmitReport({
      category,
      severity,
      description,
      location_name: locationName || `${currentWardName} Street Point`,
      lat: 17.3820,
      lng: 78.4235,
      photo_url: hasPhoto ? 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=500&auto=format&fit=crop&q=60' : undefined,
      has_audio_note: hasAudio
    });
    setModalOpen(false);
    setDescription('');
    setLocationName('');
    alert('Thank you! Your citizen report was submitted and broadcast to nearby residents and GHMC field units.');
  };

  const toggleAudio = (reportId: string) => {
    if (playingAudioId === reportId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(reportId);
      setTimeout(() => setPlayingAudioId(null), 4000);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'waterlogging':
        return getTranslation(currentLang, 'cat_waterlogging');
      case 'blocked_drain':
        return getTranslation(currentLang, 'cat_blocked_drain');
      case 'heat_stress':
        return getTranslation(currentLang, 'cat_heat_stress');
      case 'power_cut':
        return getTranslation(currentLang, 'cat_power_cut');
      default:
        return cat;
    }
  };

  return (
    <div className="w-full bg-[#FFFFFF] rounded-card border border-[#EADBCA] p-6 lg:p-8 shadow-level1" id="citizen-reports-section">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#EADBCA]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#EE7B30] flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            {getTranslation(currentLang, 'reports_tag')}
          </span>
          <h3 className="font-heading text-xl lg:text-2xl font-bold text-[#1c1b1a]">
            {getTranslation(currentLang, 'reports_title')}
          </h3>
          <p className="text-xs text-[#6F6A60] mt-0.5">
            {getTranslation(currentLang, 'reports_subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#1F7A8C] text-white hover:bg-[#17606F] text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{getTranslation(currentLang, 'report_issue_btn')}</span>
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="tactile-card p-5 border border-[#EADBCA] rounded-2xl bg-white flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#F3EBDD] text-[#1c1b1a]">
                  {getCategoryLabel(rep.category)}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    rep.severity === 'Severe'
                      ? 'bg-[#FBE1DF] text-[#D9453D]'
                      : rep.severity === 'High'
                      ? 'bg-[#FDE6D6] text-[#EE7B30]'
                      : 'bg-[#FDF3D8] text-[#F2B134]'
                  }`}
                >
                  {getTranslation(currentLang, rep.severity === 'Severe' ? 'risk_severe' : rep.severity === 'High' ? 'risk_high' : 'risk_moderate')}
                </span>
              </div>

              {rep.photo_url && (
                <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-3 bg-[#F3EBDD] shadow-sm">
                  <img
                    src={rep.photo_url}
                    alt="Citizen report photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium flex items-center gap-1">
                    <Camera className="w-3 h-3 text-[#EADBCA]" />
                    <span>Geo-tagged Photo</span>
                  </div>
                </div>
              )}

              {/* Voice Note Mockup Pill */}
              {rep.has_audio_note && (
                <div className="mb-3 p-2 rounded-xl bg-[#F3EBDD] border border-[#EADBCA] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAudio(rep.id)}
                    className="w-7 h-7 rounded-full bg-[#1F7A8C] text-white flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
                  >
                    {playingAudioId === rep.id ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1 flex items-center gap-1 h-3 overflow-hidden">
                    {[6, 12, 18, 10, 16, 8, 14, 20, 12, 16, 8, 10, 14, 18].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full transition-all ${
                          playingAudioId === rep.id ? 'bg-[#1F7A8C] animate-pulse' : 'bg-[#6F6A60]/40'
                        }`}
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-[#6F6A60]">
                    {playingAudioId === rep.id ? 'Playing...' : 'Voice Note (0:14)'}
                  </span>
                </div>
              )}

              <p className="text-sm font-medium text-[#1c1b1a] mb-2 leading-snug">
                {rep.description}
              </p>

              <div className="flex items-center gap-1.5 text-xs text-[#6F6A60] mb-3">
                <MapPin className="w-3.5 h-3.5 text-[#1F7A8C] shrink-0" />
                <span className="line-clamp-1">{rep.location_name}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#EADBCA] flex items-center justify-between">
              <span className="text-[11px] text-[#6F6A60] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {rep.timestamp}
              </span>

              <button
                type="button"
                onClick={() => onConfirmReport(rep.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E6F5ED] hover:bg-[#4CAF7A] hover:text-white text-[#4CAF7A] text-xs font-semibold transition-all border border-[#4CAF7A]/30 cursor-pointer shadow-sm"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{getTranslation(currentLang, 'confirm_btn')} ({rep.confirm_votes})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* REPORT SUBMISSION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-modal border border-[#EADBCA] max-w-lg w-full p-6 shadow-level3">
            <div className="flex items-center justify-between pb-4 border-b border-[#EADBCA] mb-4">
              <h4 className="font-heading font-bold text-lg text-[#1c1b1a]">
                {getTranslation(currentLang, 'modal_report_title')}
              </h4>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F3EBDD] flex items-center justify-center text-sm font-bold hover:bg-[#EADBCA] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6F6A60] mb-1">
                  {getTranslation(currentLang, 'modal_category_label')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'waterlogging', label: `🌊 ${getTranslation(currentLang, 'cat_waterlogging')}` },
                    { id: 'blocked_drain', label: `🪵 ${getTranslation(currentLang, 'cat_blocked_drain')}` },
                    { id: 'heat_stress', label: `☀️ ${getTranslation(currentLang, 'cat_heat_stress')}` },
                    { id: 'power_cut', label: `⚡ ${getTranslation(currentLang, 'cat_power_cut')}` }
                  ].map(c => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCategory(c.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                        category === c.id
                          ? 'bg-[#E3F1F4] text-[#006070] border-[#1F7A8C] shadow-sm font-bold'
                          : 'bg-white text-[#6F6A60] border-[#EADBCA] hover:bg-[#F3EBDD]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6F6A60] mb-1">
                  {getTranslation(currentLang, 'modal_location_label')}
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Near Quba Masjid, Military Road Junction"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADBCA] text-xs outline-none focus:border-[#1F7A8C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6F6A60] mb-1">
                  {getTranslation(currentLang, 'modal_desc_label')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe water depth, blockage cause, or stranded residents..."
                  className="w-full p-3 rounded-xl border border-[#EADBCA] text-xs outline-none focus:border-[#1F7A8C]"
                />
              </div>

              {/* Media Attachments: Photo & Audio Toggles */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setHasPhoto(!hasPhoto)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                    hasPhoto ? 'bg-[#E3F1F4] text-[#006070] border-[#1F7A8C]' : 'bg-white text-[#6F6A60] border-[#EADBCA]'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{hasPhoto ? 'Photo Attached' : 'Attach Photo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHasAudio(!hasAudio)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                    hasAudio ? 'bg-[#FDEBD3] text-[#914d00] border-[#EE7B30]' : 'bg-white text-[#6F6A60] border-[#EADBCA]'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{hasAudio ? 'Voice Note Included' : 'Record Audio Note'}</span>
                </button>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#EADBCA]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#EADBCA] text-xs font-semibold text-[#6F6A60] hover:bg-[#F3EBDD] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1F7A8C] text-white text-xs font-semibold hover:bg-[#17606F] transition-colors cursor-pointer shadow-sm"
                >
                  {getTranslation(currentLang, 'modal_submit_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
