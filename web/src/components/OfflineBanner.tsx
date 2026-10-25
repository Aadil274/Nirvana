'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X, ShieldAlert } from 'lucide-react';

interface OfflineBannerProps {
  lastUpdatedText?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  lastUpdatedText = '15 minutes ago'
}) => {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof window !== 'undefined' && 'onLine' in navigator) {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 w-full bg-[#FDF3D8] border-b border-[#F2B134]/40 px-4 py-2.5 text-xs text-[#914d00] shadow-sm animate-fade-in"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-[#EE7B30] shrink-0" />
          <span className="font-semibold">
            Offline Mode Active:
          </span>
          <span className="text-[11px] text-[#6F6A60] hidden sm:inline">
            Displaying cached telemetry from {lastUpdatedText}. Offline SMS & emergency calls remain functional.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (navigator.onLine) {
                setIsOffline(false);
              } else {
                alert('Device is still offline. Please verify Wi-Fi or mobile network.');
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-[#914d00] hover:bg-[#F3EBDD] font-bold border border-[#F2B134]/40 text-xs cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-[#EE7B30]" />
            <span>Reconnect</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-[#6F6A60] hover:text-[#1c1b1a] p-1 rounded cursor-pointer"
            aria-label="Dismiss offline banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
