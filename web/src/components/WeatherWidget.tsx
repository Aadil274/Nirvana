'use client';

import React, { useState } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  Wind,
  Droplets,
  RefreshCw,
  Compass,
  Calendar,
  Clock,
  AlertTriangle,
  Sparkles,
  Info,
  Sunrise,
  Sunset,
  Eye,
  Gauge
} from 'lucide-react';
import { WeatherData, SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';

interface WeatherWidgetProps {
  weather: WeatherData | null;
  locationName: string;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  currentLang: SupportedLanguage;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weather,
  locationName,
  isLoading,
  error,
  onRefresh,
  currentLang
}) => {
  const [forecastTab, setForecastTab] = useState<'hourly' | 'daily'>('hourly');
  const [showChart, setShowChart] = useState(true);

  // Weather Icon Helper
  const renderWeatherIcon = (icon: string, className: string = 'w-5 h-5') => {
    switch (icon) {
      case 'sun':
        return <Sun className={`${className} text-[#EE7B30]`} />;
      case 'cloud-sun':
        return <CloudSun className={`${className} text-[#1F7A8C]`} />;
      case 'cloud-drizzle':
        return <CloudDrizzle className={`${className} text-[#1F7A8C]`} />;
      case 'cloud-rain':
        return <CloudRain className={`${className} text-[#006070]`} />;
      case 'cloud-lightning':
        return <CloudLightning className={`${className} text-[#D9453D]`} />;
      case 'cloud':
      default:
        return <Cloud className={`${className} text-[#6F6A60]`} />;
    }
  };

  // Format hour label e.g. "2026-10-25T22:00" -> "22:00" or "10 PM"
  const formatHour = (isoTime: string) => {
    try {
      const d = new Date(isoTime);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return isoTime.slice(11, 16);
    }
  };

  // Format date label e.g. "2026-10-26" -> "Mon 26"
  const formatDay = (isoDate: string, index: number) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
    } catch {
      return isoDate;
    }
  };

  // Build SVG Area Chart coordinates for 24-hour temperature and precipitation
  const hourlyData = weather?.hourly ? weather.hourly.slice(0, 16) : [];
  const temps = hourlyData.map(h => h.temperature_c);
  const minTemp = temps.length > 0 ? Math.floor(Math.min(...temps)) - 2 : 20;
  const maxTemp = temps.length > 0 ? Math.ceil(Math.max(...temps)) + 2 : 36;
  const tempRange = Math.max(1, maxTemp - minTemp);

  const chartWidth = 720;
  const chartHeight = 110;

  // Temperature path
  const tempPoints = hourlyData.map((h, i) => {
    const x = (i / Math.max(1, hourlyData.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - 20 - ((h.temperature_c - minTemp) / tempRange) * (chartHeight - 40);
    return { x, y, temp: h.temperature_c, rain: h.precipitation_probability_pct, time: h.time };
  });

  const tempLinePath = tempPoints.length > 1
    ? tempPoints.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, '')
    : '';

  const tempAreaPath = tempPoints.length > 1
    ? `${tempLinePath} L ${tempPoints[tempPoints.length - 1].x.toFixed(1)},${chartHeight - 10} L ${tempPoints[0].x.toFixed(1)},${chartHeight - 10} Z`
    : '';

  return (
    <div className="w-full bg-[#FFFFFF] rounded-card border border-[#EADBCA] p-6 lg:p-8 shadow-level1 mb-8" id="live-weather-feed">
      {/* Top Header: Location, Badges & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#EADBCA]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F7A8C] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Live Meteorological Intelligence
            </span>
            {weather && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                weather.metadata.cached
                  ? 'bg-[#E3F1F4] text-[#006070] border-[#1F7A8C]/30'
                  : 'bg-[#E6F5ED] text-[#4CAF7A] border-[#4CAF7A]/30'
              }`}>
                {weather.metadata.cached ? 'Model Ensemble' : 'Live Radar Telemetry'}
              </span>
            )}
          </div>
          <h2 className="font-heading text-xl lg:text-2xl font-bold text-[#1c1b1a]">
            {locationName}
          </h2>
          {weather && (
            <p className="text-xs text-[#6F6A60] mt-0.5">
              {weather.location.lat.toFixed(4)}° N, {weather.location.lng.toFixed(4)}° E • Timezone: {weather.location.timezone}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="flex items-center bg-[#F3EBDD] p-1 rounded-full border border-[#EADBCA] text-xs shadow-inner">
            <button
              type="button"
              onClick={() => setForecastTab('hourly')}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                forecastTab === 'hourly'
                  ? 'bg-white text-[#1c1b1a] shadow-sm font-bold'
                  : 'text-[#6F6A60] hover:text-[#1c1b1a]'
              }`}
            >
              24-Hour
            </button>
            <button
              type="button"
              onClick={() => setForecastTab('daily')}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                forecastTab === 'daily'
                  ? 'bg-white text-[#1c1b1a] shadow-sm font-bold'
                  : 'text-[#6F6A60] hover:text-[#1c1b1a]'
              }`}
            >
              7-Day
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Fetch fresh weather observations from Open-Meteo"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FBF7EF] hover:bg-[#F3EBDD] text-[#1c1b1a] text-xs font-semibold border border-[#EADBCA] transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1F7A8C] ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mt-4 p-3 bg-[#FBE1DF] border border-[#D9453D]/30 rounded-xl text-xs text-[#D9453D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="underline font-bold hover:text-[#b8322b] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Weather Display */}
      {weather && (
        <div className="pt-6">
          {/* Top Row: Hero Temperature & Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-6">
            
            {/* Primary Current Weather Display (5 Cols) */}
            <div className="lg:col-span-5 flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-[#FBF7EF] via-[#FBF7EF] to-[#F3EBDD]/60 border border-[#EADBCA] tactile-card">
              <div className="w-18 h-18 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-[#EADBCA]">
                {renderWeatherIcon(weather.current.weather_icon, 'w-10 h-10')}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-4xl sm:text-5xl font-extrabold text-[#1c1b1a]">
                    {weather.current.temperature_c}°
                  </span>
                  <span className="text-sm font-semibold text-[#6F6A60]">C</span>
                  <span className="text-xs text-[#6F6A60] ml-2 font-medium">
                    Feels like <strong>{weather.current.apparent_temperature_c}°C</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-[#1c1b1a]">
                    {weather.current.weather_description}
                  </span>
                  <span className="text-xs text-[#6F6A60]">
                    • {weather.current.is_day ? 'Daytime' : 'Night'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Essential Atmospheric Metrics (7 Cols) */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Metric 1: Humidity */}
              <div className="p-3.5 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA] flex flex-col justify-between hover:bg-white transition-colors">
                <div className="flex items-center justify-between text-xs text-[#6F6A60] mb-1">
                  <span>Humidity</span>
                  <Droplets className="w-3.5 h-3.5 text-[#1F7A8C]" />
                </div>
                <span className="font-heading text-lg font-bold text-[#1c1b1a]">
                  {weather.current.humidity_pct}%
                </span>
                <span className="text-[10px] text-[#6F6A60] mt-0.5">
                  {weather.current.humidity_pct > 75 ? 'High Moisture' : 'Comfortable'}
                </span>
              </div>

              {/* Metric 2: Wind */}
              <div className="p-3.5 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA] flex flex-col justify-between hover:bg-white transition-colors">
                <div className="flex items-center justify-between text-xs text-[#6F6A60] mb-1">
                  <span>Wind Speed</span>
                  <Wind className="w-3.5 h-3.5 text-[#1F7A8C]" />
                </div>
                <span className="font-heading text-lg font-bold text-[#1c1b1a]">
                  {weather.current.wind_speed_kmh} <span className="text-xs font-normal">km/h</span>
                </span>
                <span className="text-[10px] text-[#6F6A60] mt-0.5">
                  {weather.current.wind_direction_cardinal} ({weather.current.wind_direction_deg}°)
                </span>
              </div>

              {/* Metric 3: Precipitation */}
              <div className="p-3.5 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA] flex flex-col justify-between hover:bg-white transition-colors">
                <div className="flex items-center justify-between text-xs text-[#6F6A60] mb-1">
                  <span>Precipitation</span>
                  <CloudRain className="w-3.5 h-3.5 text-[#1F7A8C]" />
                </div>
                <span className="font-heading text-lg font-bold text-[#1c1b1a]">
                  {weather.current.precipitation_mm} <span className="text-xs font-normal">mm/h</span>
                </span>
                <span className="text-[10px] text-[#6F6A60] mt-0.5">
                  {weather.current.precipitation_mm > 10 ? 'Heavy Rainfall' : (weather.current.precipitation_mm > 0 ? 'Light Rain' : 'Dry')}
                </span>
              </div>

              {/* Metric 4: Pressure */}
              <div className="p-3.5 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA] flex flex-col justify-between hover:bg-white transition-colors">
                <div className="flex items-center justify-between text-xs text-[#6F6A60] mb-1">
                  <span>Air Pressure</span>
                  <Gauge className="w-3.5 h-3.5 text-[#1F7A8C]" />
                </div>
                <span className="font-heading text-lg font-bold text-[#1c1b1a]">
                  {weather.current.surface_pressure_hpa ? Math.round(weather.current.surface_pressure_hpa) : '1012'} <span className="text-xs font-normal">hPa</span>
                </span>
                <span className="text-[10px] text-[#6F6A60] mt-0.5">
                  Standard Baro
                </span>
              </div>
            </div>
          </div>

          {/* 24-HOUR VISUAL TEMPERATURE & RAIN AREA CHART (from PDF spec) */}
          {forecastTab === 'hourly' && tempPoints.length > 2 && (
            <div className="mb-6 p-4 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA]">
              <div className="flex items-center justify-between mb-2 text-xs text-[#6F6A60]">
                <span className="font-bold uppercase tracking-wider text-[#1c1b1a] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#1F7A8C]" />
                  24-Hour Temperature Curve & Rain Probability
                </span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F28C28]"></span> Temp (°C)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1F7A8C]"></span> Rain Chance (%)
                  </span>
                </div>
              </div>

              <div className="w-full overflow-hidden">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-28">
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F28C28" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#F28C28" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal gridlines */}
                  <line x1="20" y1="20" x2={chartWidth - 20} y2="20" stroke="#EADBCA" strokeDasharray="3 3" />
                  <line x1="20" y1="55" x2={chartWidth - 20} y2="55" stroke="#EADBCA" strokeDasharray="3 3" />
                  <line x1="20" y1="90" x2={chartWidth - 20} y2="90" stroke="#EADBCA" strokeDasharray="3 3" />

                  {/* Hourly Rain Probability Bars */}
                  {tempPoints.map((pt, i) => {
                    const barHeight = (pt.rain / 100) * 45;
                    return (
                      <rect
                        key={`bar-${i}`}
                        x={pt.x - 6}
                        y={chartHeight - 15 - barHeight}
                        width="12"
                        height={barHeight}
                        rx="2"
                        fill="#1F7A8C"
                        opacity="0.30"
                      />
                    );
                  })}

                  {/* Smooth Temperature Area Fill */}
                  <path d={tempAreaPath} fill="url(#tempGradient)" />

                  {/* Temperature Curve Line */}
                  <path d={tempLinePath} fill="none" stroke="#F28C28" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Temperature Data Points with Labels */}
                  {tempPoints.map((pt, i) => (
                    <g key={`pt-${i}`}>
                      <circle cx={pt.x} cy={pt.y} r="3.5" fill="#FFFFFF" stroke="#F28C28" strokeWidth="2" />
                      <text x={pt.x} y={pt.y - 7} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1c1b1a">
                        {pt.temp}°
                      </text>
                      <text x={pt.x} y={chartHeight - 3} textAnchor="middle" fontSize="8" fill="#6F6A60">
                        {formatHour(pt.time).split(' ')[0]}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          )}

          {/* Forecast Cards Strip */}
          <div className="border-t border-[#EADBCA] pt-5">
            <div className="flex items-center justify-between mb-3 text-xs text-[#6F6A60]">
              <span className="font-bold uppercase tracking-wider text-[#1c1b1a] flex items-center gap-1.5">
                {forecastTab === 'hourly' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-[#1F7A8C]" />
                    Hourly Forecast Matrix
                  </>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5 text-[#1F7A8C]" />
                    7-Day Extended Outlook
                  </>
                )}
              </span>
              <span>Updated: {formatHour(weather.current.time)}</span>
            </div>

            {/* Hourly View */}
            {forecastTab === 'hourly' && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {weather.hourly.map((h, i) => (
                  <div
                    key={h.time || i}
                    className="shrink-0 w-24 p-3 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA] text-center flex flex-col items-center justify-between transition-all hover:bg-white hover:shadow-sm"
                  >
                    <span className="text-[11px] font-semibold text-[#6F6A60]">
                      {formatHour(h.time)}
                    </span>
                    <div className="my-2">
                      {renderWeatherIcon(h.weather_icon, 'w-6 h-6')}
                    </div>
                    <span className="font-heading text-sm font-bold text-[#1c1b1a]">
                      {h.temperature_c}°C
                    </span>
                    <div className="mt-1 w-full bg-[#EADBCA] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1F7A8C] h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, h.precipitation_probability_pct)}%` }}
                        title={`Rain probability: ${h.precipitation_probability_pct}%`}
                      ></div>
                    </div>
                    <span className="text-[9px] text-[#6F6A60] mt-1 font-semibold">
                      {h.precipitation_probability_pct}% rain
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Daily View */}
            {forecastTab === 'daily' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {weather.daily.map((d, i) => (
                  <div
                    key={d.date || i}
                    className="p-3.5 rounded-2xl bg-[#FBF7EF] border border-[#EADBCA] text-center flex flex-col items-center justify-between transition-all hover:bg-white hover:shadow-sm"
                  >
                    <span className="text-xs font-bold text-[#1c1b1a]">
                      {formatDay(d.date, i)}
                    </span>
                    <div className="my-2.5">
                      {renderWeatherIcon(d.weather_icon, 'w-7 h-7')}
                    </div>
                    <span className="text-[11px] text-[#6F6A60] line-clamp-1 mb-1">
                      {d.weather_description}
                    </span>
                    <div className="flex items-baseline gap-1.5 text-xs font-heading font-bold text-[#1c1b1a]">
                      <span>{d.temp_max_c}°</span>
                      <span className="text-[#6F6A60] font-normal text-[11px]">/ {d.temp_min_c}°</span>
                    </div>
                    {d.precipitation_sum_mm > 0 ? (
                      <span className="text-[10px] font-semibold text-[#006070] mt-1 bg-[#E3F1F4] px-2 py-0.5 rounded-full">
                        {d.precipitation_sum_mm} mm
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#6F6A60] mt-1">
                        Dry
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meteorological Footnote & Provider Attribution */}
          <div className="mt-5 pt-3 border-t border-[#EADBCA]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-[#6F6A60] gap-2">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#1F7A8C]" />
              {weather.metadata.model_attribution} via {weather.metadata.provider}
            </span>
            <span>
              Observation telemetry synchronized: {weather.current.time} ({weather.location.timezone})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
