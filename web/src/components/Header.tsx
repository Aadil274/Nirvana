'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SupportedLanguage } from '../types';
import { LANGUAGES, getTranslation } from '../lib/i18n';
import { useAuth } from '../lib/AuthContext';
import {
  Shield,
  Sparkles,
  Volume2,
  Globe,
  UserCheck,
  LayoutDashboard,
  Eye,
  Activity,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  isSimpleMode: boolean;
  onToggleSimpleMode: () => void;
  isCommandView: boolean;
  onToggleCommandView: () => void;
  onCheckStreetClick: () => void;
  onStaffLoginClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  isSimpleMode,
  onToggleSimpleMode,
  isCommandView,
  onToggleCommandView,
  onCheckStreetClick,
  onStaffLoginClick
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 w-full z-50 pointer-events-auto">
      {/* 1. TOP CIVIC NOTIFICATION BAR */}
      <div className="w-full bg-[#FDEBD3] py-1.5 px-4 lg:px-8 border-b border-[#914d00]/15">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[#1c1b1a]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#914d00] text-[18px]">campaign</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#914d00]">
              CIVIC ADVISORY
            </span>
            <span className="hidden md:inline text-xs text-[#2B2A28]">
              {getTranslation(currentLang, 'civic_advisory')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6F6A60] hidden sm:inline">
              {getTranslation(currentLang, 'header_pilot')}
            </span>
            <button
              onClick={() => {
                alert('CIVIC PROTOCOL ADVISORY: Level-2 Monsoon Early Warning active. Low-lying basements must activate bilge sump pumps. Public emergency lines 112 & 1070 prioritized.');
              }}
              className="text-xs font-semibold text-[#914d00] hover:underline cursor-pointer"
            >
              {getTranslation(currentLang, 'header_protocol')}
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER NAVIGATION */}
      <div className="w-full bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#EADBCA] shadow-sm">
        <div className="h-18 max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
          
          {/* LOGO & BRAND */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-full bg-[#1F7A8C] flex items-center justify-center text-white shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-heading text-xl font-bold text-[#006070] tracking-tight">
                  {getTranslation(currentLang, 'app_name') || 'Nirvana'}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-[#E3F1F4] text-[#006070] text-[11px] font-semibold">
                  {getTranslation(currentLang, 'header_tagline')}
                </span>
              </div>
              <span className="text-[11px] text-[#6F6A60] hidden md:block">
                {getTranslation(currentLang, 'header_network')}
              </span>
            </div>
          </div>

          {/* DESKTOP NAV ANCHORS */}
          <nav className="hidden xl:flex items-center gap-1 bg-[#F3EBDD]/60 p-1 rounded-full border border-[#EADBCA]">
            <a href="#live-risk-map" className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#2B2A28] hover:bg-[#FFFFFF] hover:shadow-sm transition-all">
              {getTranslation(currentLang, 'live_risk_map')}
            </a>
            <a href="#monitor-section" className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#2B2A28] hover:bg-[#FFFFFF] hover:shadow-sm transition-all">
              {getTranslation(currentLang, 'header_street_telemetry')}
            </a>
            <a href="#verified-shelters" className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#2B2A28] hover:bg-[#FFFFFF] hover:shadow-sm transition-all">
              {getTranslation(currentLang, 'find_shelters')}
            </a>
            <a href="#citizen-reports-section" className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#2B2A28] hover:bg-[#FFFFFF] hover:shadow-sm transition-all">
              {getTranslation(currentLang, 'citizen_reports')}
            </a>
          </nav>

          {/* ACTIONS & CONTROLS */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live sync pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6F5ED] text-[#2B2A28] text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[#4CAF7A] animate-pulse"></span>
              <span>{getTranslation(currentLang, 'header_live_imd')}</span>
            </div>

            {/* Simple Mode Toggle */}
            <button
              onClick={onToggleSimpleMode}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                isSimpleMode
                  ? 'bg-[#EE7B30] text-white border-[#EE7B30] shadow-sm'
                  : 'bg-[#FFFFFF] text-[#2B2A28] border-[#EADBCA] hover:bg-[#F3EBDD]'
              }`}
              title="Toggle Ultra-Minimal Large Text View for Elderly / Low-Literacy"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{getTranslation(currentLang, 'header_simple_mode')}</span>
            </button>

            {/* Language Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3EBDD] hover:bg-[#FDEBD3] text-[#2B2A28] text-xs font-semibold transition-colors border border-[#EADBCA]"
              >
                <Globe className="w-3.5 h-3.5 text-[#006070]" />
                <span>{LANGUAGES.find(l => l.code === currentLang)?.nativeName || 'Language'}</span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-level2 border border-[#EADBCA] py-2 z-50">
                  <div className="px-3 py-1 text-[11px] uppercase font-bold text-[#6F6A60] border-b border-[#EADBCA]">
                    Regional Languages
                  </div>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F3EBDD] transition-colors ${
                        currentLang === lang.code ? 'font-bold text-[#006070] bg-[#E3F1F4]' : 'text-[#2B2A28]'
                      }`}
                    >
                      <span>{lang.nativeName}</span>
                      <span className="text-[11px] text-[#6F6A60]">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Staff / Command Center Switch */}
            <button
              onClick={onToggleCommandView}
              className={`hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                isCommandView
                  ? 'bg-[#006070] text-white border-[#006070]'
                  : 'bg-[#FFFFFF] text-[#006070] border-[#EADBCA] hover:bg-[#F3EBDD]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{isCommandView ? getTranslation(currentLang, 'header_citizen_view') : getTranslation(currentLang, 'header_command_view')}</span>
            </button>

            {/* Authentication Action Pill */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E3F1F4] hover:bg-[#d5edf2] text-[#006070] text-xs font-semibold border border-[#1F7A8C]/30 transition-all cursor-pointer shadow-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-[#1F7A8C] text-white flex items-center justify-center text-[10px] font-bold">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[90px] truncate">{user.full_name ? user.full_name.split(' ')[0] : 'User'}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-level3 border border-[#EADBCA] py-2 z-50 animate-fade-in text-xs">
                    <div className="px-4 py-2 border-b border-[#EADBCA]">
                      <span className="font-bold text-[#1c1b1a] block truncate">{user.full_name}</span>
                      <span className="text-[11px] text-[#6F6A60] block truncate">{user.email}</span>
                      <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E6F5ED] text-[#4CAF7A]">
                        {user.role === 'admin' ? 'Municipal Officer' : 'Verified Citizen'}
                      </span>
                    </div>
                    <div className="py-1">
                      <div className="px-4 py-1.5 text-[11px] text-[#6F6A60]">
                        Monitored: <strong className="text-[#1c1b1a]">{user.ward_id || 'ward-72'}</strong>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-[#EADBCA]">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-[#D9453D] hover:bg-[#FBE1DF] font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/signin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#F3EBDD] text-[#1c1b1a] text-xs font-semibold border border-[#EADBCA] shadow-sm transition-all"
              >
                <User className="w-3.5 h-3.5 text-[#1F7A8C]" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {/* Primary Action Button */}
            <button
              onClick={onCheckStreetClick}
              className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#1F7A8C] text-white hover:bg-[#17606F] text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] mr-1">my_location</span>
              {getTranslation(currentLang, 'check_my_street')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
