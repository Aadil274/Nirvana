/**
 * Nirvana Civic Climate Resilience Platform
 * Client-Side Weather Service Module
 *
 * Integrates directly with Nirvana's backend weather service (backed by Open-Meteo)
 * with graceful direct Open-Meteo fallback when running in standalone static mode.
 */

import { WeatherData, CurrentWeather, HourlyForecastItem, DailyForecastItem } from '../types';

import { API_BASE } from './api';

// WMO Weather code dictionary for client-side fallback
const WMO_MAP: Record<number, { desc: string; category: string; icon: string }> = {
  0: { desc: 'Clear sky', category: 'clear', icon: 'sun' },
  1: { desc: 'Mainly clear', category: 'clear', icon: 'sun' },
  2: { desc: 'Partly cloudy', category: 'cloudy', icon: 'cloud-sun' },
  3: { desc: 'Overcast', category: 'cloudy', icon: 'cloud' },
  45: { desc: 'Fog', category: 'fog', icon: 'cloud-fog' },
  48: { desc: 'Depositing rime fog', category: 'fog', icon: 'cloud-fog' },
  51: { desc: 'Light drizzle', category: 'drizzle', icon: 'cloud-drizzle' },
  53: { desc: 'Moderate drizzle', category: 'drizzle', icon: 'cloud-drizzle' },
  55: { desc: 'Dense drizzle', category: 'drizzle', icon: 'cloud-drizzle' },
  61: { desc: 'Slight rain', category: 'rain', icon: 'cloud-rain' },
  63: { desc: 'Moderate rain', category: 'rain', icon: 'cloud-rain' },
  65: { desc: 'Heavy rain deluge', category: 'rain', icon: 'cloud-rain' },
  71: { desc: 'Slight snow', category: 'snow', icon: 'cloud-snow' },
  73: { desc: 'Moderate snow', category: 'snow', icon: 'cloud-snow' },
  75: { desc: 'Heavy snow', category: 'snow', icon: 'cloud-snow' },
  80: { desc: 'Rain showers', category: 'rain', icon: 'cloud-rain' },
  81: { desc: 'Moderate showers', category: 'rain', icon: 'cloud-rain' },
  82: { desc: 'Violent showers', category: 'rain', icon: 'cloud-rain' },
  95: { desc: 'Thunderstorm', category: 'thunderstorm', icon: 'cloud-lightning' },
  96: { desc: 'Thunderstorm with hail', category: 'thunderstorm', icon: 'cloud-lightning' },
  99: { desc: 'Severe thunderstorm with heavy hail', category: 'thunderstorm', icon: 'cloud-lightning' }
};

const CARDINALS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

function degToCardinal(deg?: number): string {
  if (deg === undefined || deg === null) return 'N/A';
  const idx = Math.round(deg / 22.5) % 16;
  return CARDINALS[idx];
}

export async function fetchWeather(
  lat: number,
  lng: number,
  forceRefresh: boolean = false,
  signal?: AbortSignal
): Promise<WeatherData> {
  // 1. First attempt through secure Nirvana FastAPI Backend proxy
  try {
    const res = await fetch(
      `${API_BASE}/forecast?lat=${lat}&lng=${lng}&refresh=${forceRefresh}`,
      { signal }
    );
    if (res.ok) {
      const data: WeatherData = await res.json();
      return data;
    }
  } catch (backendError) {
    // Backend offline / not running in local environment: proceed to direct Open-Meteo fallback
  }

  // 2. Direct client-side Open-Meteo integration for standalone resilience
  const openMeteoUrl = new URL('https://api.open-meteo.com/v1/forecast');
  openMeteoUrl.searchParams.set('latitude', lat.toString());
  openMeteoUrl.searchParams.set('longitude', lng.toString());
  openMeteoUrl.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure');
  openMeteoUrl.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,rain,weather_code,wind_speed_10m');
  openMeteoUrl.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset,uv_index_max');
  openMeteoUrl.searchParams.set('timezone', 'auto');
  openMeteoUrl.searchParams.set('forecast_days', '7');

  const omRes = await fetch(openMeteoUrl.toString(), { signal });
  if (!omRes.ok) {
    throw new Error(`Open-Meteo API returned status ${omRes.status}`);
  }

  const raw = await omRes.json();
  const cRaw = raw.current || {};
  const hRaw = raw.hourly || {};
  const dRaw = raw.daily || {};

  const wCode = cRaw.weather_code;
  const wInfo = WMO_MAP[wCode] || { desc: `Weather code ${wCode}`, category: 'cloudy', icon: 'cloud' };

  const current: CurrentWeather = {
    time: cRaw.time,
    temperature_c: Math.round(cRaw.temperature_2m * 10) / 10,
    apparent_temperature_c: Math.round(cRaw.apparent_temperature * 10) / 10,
    humidity_pct: Math.round(cRaw.relative_humidity_2m),
    precipitation_mm: cRaw.precipitation || 0,
    rain_mm: cRaw.rain || 0,
    showers_mm: cRaw.showers || 0,
    weather_code: wCode,
    weather_description: wInfo.desc,
    weather_category: wInfo.category,
    weather_icon: wInfo.icon,
    is_day: Boolean(cRaw.is_day),
    wind_speed_kmh: Math.round(cRaw.wind_speed_10m * 10) / 10,
    wind_direction_deg: cRaw.wind_direction_10m,
    wind_direction_cardinal: degToCardinal(cRaw.wind_direction_10m),
    surface_pressure_hpa: cRaw.surface_pressure,
    rainfall_rate_mm_hr: cRaw.precipitation || 0
  };

  const hourly: HourlyForecastItem[] = [];
  const hTimes = hRaw.time || [];
  for (let i = 0; i < Math.min(24, hTimes.length); i++) {
    const code = hRaw.weather_code?.[i];
    const info = WMO_MAP[code] || { desc: 'Cloudy', category: 'cloudy', icon: 'cloud' };
    hourly.push({
      time: hTimes[i],
      temperature_c: Math.round(hRaw.temperature_2m?.[i] * 10) / 10,
      apparent_temperature_c: Math.round(hRaw.apparent_temperature?.[i] * 10) / 10,
      humidity_pct: Math.round(hRaw.relative_humidity_2m?.[i] || 0),
      precipitation_probability_pct: Math.round(hRaw.precipitation_probability?.[i] || 0),
      rain_mm: hRaw.rain?.[i] || 0,
      weather_code: code,
      weather_description: info.desc,
      weather_icon: info.icon,
      wind_speed_kmh: Math.round(hRaw.wind_speed_10m?.[i] || 0)
    });
  }

  const daily: DailyForecastItem[] = [];
  const dTimes = dRaw.time || [];
  for (let i = 0; i < dTimes.length; i++) {
    const code = dRaw.weather_code?.[i];
    const info = WMO_MAP[code] || { desc: 'Clear', category: 'clear', icon: 'sun' };
    daily.push({
      date: dTimes[i],
      weather_code: code,
      weather_description: info.desc,
      weather_icon: info.icon,
      temp_max_c: Math.round(dRaw.temperature_2m_max?.[i] * 10) / 10,
      temp_min_c: Math.round(dRaw.temperature_2m_min?.[i] * 10) / 10,
      apparent_temp_max_c: Math.round(dRaw.apparent_temperature_max?.[i] * 10) / 10,
      apparent_temp_min_c: Math.round(dRaw.apparent_temperature_min?.[i] * 10) / 10,
      precipitation_sum_mm: Math.round((dRaw.precipitation_sum?.[i] || 0) * 10) / 10,
      precipitation_probability_max_pct: Math.round(dRaw.precipitation_probability_max?.[i] || 0),
      wind_speed_max_kmh: Math.round(dRaw.wind_speed_10m_max?.[i] || 0),
      sunrise: dRaw.sunrise?.[i],
      sunset: dRaw.sunset?.[i],
      uv_index_max: dRaw.uv_index_max?.[i]
    });
  }

  return {
    location: {
      lat,
      lng,
      timezone: raw.timezone || 'UTC',
      timezone_abbreviation: raw.timezone_abbreviation,
      elevation_m: raw.elevation
    },
    current,
    hourly,
    daily,
    metadata: {
      provider: 'Open-Meteo High-Resolution NWP',
      model_attribution: 'ECMWF / DWD ICON Seamless Numerical Weather Prediction',
      fetched_at: new Date().toISOString(),
      cached: false,
      is_stale: false
    }
  };
}
