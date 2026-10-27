'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WardFeature, Shelter, CitizenReport, SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';
import {
  Layers,
  Play,
  Pause,
  Compass,
  Waves,
  Flame,
  Home,
  AlertCircle,
  MapPin,
  Navigation,
  RefreshCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Crosshair,
  CheckCircle2,
  Phone,
  Droplets
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { HYDERABAD_DRAINS } from '../lib/drains';

interface MapComponentProps {
  wards: WardFeature[];
  shelters: Shelter[];
  reports: CitizenReport[];
  selectedWardId: string;
  onSelectWard: (wardId: string) => void;
  rainfallRate: number;
  simulatedTimeStep: number;
  onTimeStepChange: (step: number) => void;
  currentLang: SupportedLanguage;
  userLocation?: { lat: number; lng: number; label?: string; accuracy?: number } | null;
}

// Map Tile Providers (Legitimate, Open, Documented with standard attribution)
const TILE_STYLES = {
  voyager: {
    name: 'Detailed Streets',
    version: 8 as const,
    sources: {
      'carto-voyager': {
        type: 'raster' as const,
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>'
      }
    },
    layers: [
      {
        id: 'carto-voyager-layer',
        type: 'raster' as const,
        source: 'carto-voyager',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  },
  light: {
    name: 'Cream Neutral',
    version: 8 as const,
    sources: {
      'carto-light': {
        type: 'raster' as const,
        tiles: [
          'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
          'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>'
      }
    },
    layers: [
      {
        id: 'carto-light-layer',
        type: 'raster' as const,
        source: 'carto-light',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  },
  osm: {
    name: 'OpenStreetMap',
    version: 8 as const,
    sources: {
      'osm-tiles': {
        type: 'raster' as const,
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
      }
    },
    layers: [
      {
        id: 'osm-layer',
        type: 'raster' as const,
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  }
};

export const MapComponent: React.FC<MapComponentProps> = ({
  wards,
  shelters,
  reports,
  selectedWardId,
  onSelectWard,
  rainfallRate,
  simulatedTimeStep,
  onTimeStepChange,
  currentLang,
  userLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [activeBasemap, setActiveBasemap] = useState<'voyager' | 'light' | 'osm'>('voyager');
  const [activeLayers, setActiveLayers] = useState({
    flood: true,
    heat: false,
    drains: true,
    shelters: true,
    reports: true,
    wards: true
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [webGlSupported, setWebGlSupported] = useState(true);

  // Time scrubber automation
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        onTimeStepChange((simulatedTimeStep + 1) % 4);
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, simulatedTimeStep, onTimeStepChange]);

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers(prev => {
      const next = { ...prev, [layerKey]: !prev[layerKey] };
      // Mutual exclusion for flood and heat overlay display
      if (layerKey === 'flood' && next.flood) next.heat = false;
      if (layerKey === 'heat' && next.heat) next.flood = false;
      return next;
    });
  };

  // Convert wards features to GeoJSON
  const getWardsGeoJSON = (): GeoJSON.FeatureCollection => {
    return {
      type: 'FeatureCollection',
      features: wards.map(w => {
        const floodScore = w.properties.flood_score || 50;
        const heatScore = w.properties.heat_score || 40;
        const riskLevel = activeLayers.heat ? w.properties.heat_level : w.properties.flood_level;
        const fillColor = activeLayers.heat
          ? (heatScore >= 75 ? '#D9453D' : heatScore >= 55 ? '#EE7B30' : heatScore >= 35 ? '#F2B134' : '#4CAF7A')
          : (floodScore >= 75 ? '#D9453D' : floodScore >= 55 ? '#EE7B30' : floodScore >= 35 ? '#F2B134' : '#4CAF7A');

        return {
          type: 'Feature',
          id: w.properties.ward_id,
          properties: {
            ...w.properties,
            fill_color: fillColor,
            is_selected: w.properties.ward_id === selectedWardId
          },
          geometry: w.geometry
        };
      })
    };
  };

  // Unified helper to attach Wards and Drains sources, layers, and interactive handlers
  const setupLayersAndListeners = (map: maplibregl.Map) => {
    // 1. Wards Source & Layers
    if (!map.getSource('wards-source')) {
      map.addSource('wards-source', {
        type: 'geojson',
        data: getWardsGeoJSON()
      });

      map.addLayer({
        id: 'wards-fill',
        type: 'fill',
        source: 'wards-source',
        layout: {
          visibility: activeLayers.wards ? 'visible' : 'none'
        },
        paint: {
          'fill-color': ['get', 'fill_color'],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.55,
            0.32
          ]
        }
      });

      map.addLayer({
        id: 'wards-line',
        type: 'line',
        source: 'wards-source',
        layout: {
          visibility: activeLayers.wards ? 'visible' : 'none'
        },
        paint: {
          'line-color': ['get', 'fill_color'],
          'line-width': 1.8,
          'line-opacity': 0.85
        }
      });

      map.addLayer({
        id: 'wards-selected-outline',
        type: 'line',
        source: 'wards-source',
        filter: ['==', ['get', 'ward_id'], selectedWardId],
        layout: {
          visibility: activeLayers.wards ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#006070',
          'line-width': 3.5,
          'line-dasharray': [3, 1.5]
        }
      });

      // Ward Selection Click Listener
      map.on('click', 'wards-fill', (e) => {
        if (e.features && e.features[0]) {
          const wardId = e.features[0].properties?.ward_id;
          if (wardId) {
            onSelectWard(wardId);
          }
        }
      });

      // Hover Pointer and Visual State Listeners
      let hoveredWardId: string | number | null = null;
      map.on('mousemove', 'wards-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          if (hoveredWardId !== null) {
            map.setFeatureState({ source: 'wards-source', id: hoveredWardId }, { hover: false });
          }
          hoveredWardId = e.features[0].id ?? null;
          if (hoveredWardId !== null) {
            map.setFeatureState({ source: 'wards-source', id: hoveredWardId }, { hover: true });
          }
        }
      });

      map.on('mouseleave', 'wards-fill', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredWardId !== null) {
          map.setFeatureState({ source: 'wards-source', id: hoveredWardId }, { hover: false });
        }
        hoveredWardId = null;
      });
    }

    // 2. Stormwater Drainage Network (Musi River & GHMC Nalas)
    if (!map.getSource('drains-source')) {
      map.addSource('drains-source', {
        type: 'geojson',
        data: HYDERABAD_DRAINS as any
      });

      map.addLayer({
        id: 'drains-line',
        type: 'line',
        source: 'drains-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: activeLayers.drains ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#00A3C4',
          'line-width': [
            'case',
            ['==', ['get', 'type'], 'Primary River'],
            4.0,
            2.4
          ],
          'line-opacity': 0.85
        }
      });

      map.on('click', 'drains-line', (e) => {
        if (e.features && e.features[0]) {
          const p = e.features[0].properties;
          const conditionColor = p?.condition === 'blocked' ? '#D9453D' : p?.condition === 'partially blocked' ? '#EE7B30' : '#4CAF7A';
          new maplibregl.Popup({ offset: 12 })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-size: 11px; text-align: left; min-width: 160px;">
                <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #006070;">Municipal Drainage Channel</span>
                <strong style="display: block; color: #1c1b1a; font-size: 12px; margin-top: 2px;">${p?.name || 'Storm Nala'}</strong>
                <div style="color: #6F6A60; font-size: 10px; margin-top: 3px;">
                  Type: <strong>${p?.type || 'Drain'}</strong> | Condition: <strong style="color: ${conditionColor}">${p?.condition || 'Inspected'}</strong>
                </div>
                ${p?.water_level_m ? `<div style="font-size: 10px; color: #1c1b1a; margin-top: 2px;">Live Depth: <strong>${p.water_level_m}m</strong> (Danger: ${p.danger_level_m}m)</div>` : ''}
              </div>
            `)
            .addTo(map);
        }
      });
    }
  };

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    // Default center: User location or Central Hyderabad (near Musi / Mehdipatnam)
    const initialCenter: [number, number] = userLocation
      ? [userLocation.lng, userLocation.lat]
      : [78.440, 17.390];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: TILE_STYLES[activeBasemap],
      center: initialCenter,
      zoom: userLocation ? 13.5 : 12.2,
      minZoom: 9,
      maxZoom: 18,
      attributionControl: { compact: true }
    });

    // Add navigation and scale controls
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      setMapLoaded(true);
      setupLayersAndListeners(map);
    });

    mapRef.current = map;

    // Responsive resize handler
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle Basemap Style Switch: Persist all sources, layers, and listeners across style changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.setStyle(TILE_STYLES[activeBasemap]);

    // Re-attach sources, layers, and listeners once the new style finishes loading
    mapRef.current.once('style.load', () => {
      const map = mapRef.current;
      if (!map) return;
      setupLayersAndListeners(map);
    });
  }, [activeBasemap]);

  // Synchronize layer visibility dynamically
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (mapRef.current.getLayer('drains-line')) {
      mapRef.current.setLayoutProperty(
        'drains-line',
        'visibility',
        activeLayers.drains ? 'visible' : 'none'
      );
    }
    if (mapRef.current.getLayer('wards-fill')) {
      mapRef.current.setLayoutProperty(
        'wards-fill',
        'visibility',
        activeLayers.wards ? 'visible' : 'none'
      );
    }
    if (mapRef.current.getLayer('wards-line')) {
      mapRef.current.setLayoutProperty(
        'wards-line',
        'visibility',
        activeLayers.wards ? 'visible' : 'none'
      );
    }
    if (mapRef.current.getLayer('wards-selected-outline')) {
      mapRef.current.setLayoutProperty(
        'wards-selected-outline',
        'visibility',
        activeLayers.wards ? 'visible' : 'none'
      );
    }
  }, [activeLayers.drains, activeLayers.wards, mapLoaded]);

  // Update GeoJSON source when wards, rainfall, heat, or selection changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource('wards-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(getWardsGeoJSON());
    }

    // Update selected filter
    if (mapRef.current.getLayer('wards-selected-outline')) {
      mapRef.current.setFilter('wards-selected-outline', ['==', ['get', 'ward_id'], selectedWardId]);
    }
  }, [wards, activeLayers.heat, activeLayers.flood, selectedWardId, mapLoaded]);

  // Handle Ward Selection: Fly to centroid
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const selected = wards.find(w => w.properties.ward_id === selectedWardId);
    if (selected && selected.geometry.coordinates[0]) {
      const coords = selected.geometry.coordinates[0];
      const avgLng = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;
      const avgLat = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;

      mapRef.current.flyTo({
        center: [avgLng, avgLat],
        zoom: 13.5,
        essential: true,
        duration: 1000
      });
    }
  }, [selectedWardId, mapLoaded]);

  // Handle User GPS Location update: Fly and add/update GPS marker
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (userLocation) {
      // Remove existing GPS marker
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      // Create animated HTML GPS element
      const el = document.createElement('div');
      el.className = 'user-gps-marker';
      el.innerHTML = `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: #1F7A8C; opacity: 0.3; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 4px; border-radius: 9999px; background-color: rgba(31, 122, 140, 0.35);"></div>
          <div style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background-color: #006070; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(`
        <div style="text-align: left; font-size: 11px;">
          <strong style="color: #006070; display: block; margin-bottom: 2px;">📍 Current GPS Location</strong>
          <span style="color: #2B2A28; font-weight: 600;">${userLocation.label || 'Your Device Location'}</span>
          <div style="color: #6F6A60; font-size: 10px; margin-top: 2px;">
            ${userLocation.lat.toFixed(5)}° N, ${userLocation.lng.toFixed(5)}° E
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(popup)
        .addTo(mapRef.current);

      userMarkerRef.current = marker;

      // Fly to user coordinates
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 14.5,
        essential: true,
        duration: 1200
      });
    }
  }, [userLocation, mapLoaded]);

  // Update Shelter and Citizen Report Markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // 1. Shelter Markers
    if (activeLayers.shelters) {
      shelters.forEach(shelter => {
        const el = document.createElement('div');
        el.className = 'shelter-marker-pin';
        el.style.cursor = 'pointer';
        el.innerHTML = `
          <div style="width: 28px; height: 28px; border-radius: 9999px; background-color: #4CAF7A; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.18); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 800; font-size: 11px;">
            S
          </div>
        `;

        const occupancyPct = Math.round((shelter.current_occupancy / shelter.capacity) * 100);
        const popup = new maplibregl.Popup({ offset: 16 }).setHTML(`
          <div style="text-align: left; min-width: 170px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #4CAF7A;">Verified Safe Haven</span>
              <span style="font-size: 10px; font-weight: 700; color: #1F7A8C;">${shelter.distance_km} km</span>
            </div>
            <strong style="color: #1c1b1a; font-size: 12px; display: block; margin-bottom: 2px;">${shelter.name}</strong>
            <p style="color: #6F6A60; font-size: 10px; margin-bottom: 6px;">${shelter.address}</p>
            <div style="font-size: 10px; color: #1c1b1a; margin-bottom: 4px;">
              Occupancy: <strong>${shelter.current_occupancy}/${shelter.capacity} beds</strong> (${occupancyPct}%)
            </div>
            <div style="display: flex; gap: 4px; margin-top: 6px;">
              <a href="tel:${shelter.contact}" style="flex: 1; text-align: center; background-color: #1F7A8C; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 4px 6px; border-radius: 9999px; text-decoration: none;">
                📞 Call
              </a>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${shelter.lat},${shelter.lng}&travelmode=walking" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background-color: #4CAF7A; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 4px 6px; border-radius: 9999px; text-decoration: none;">
                🚶 Route
              </a>
            </div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([shelter.lng, shelter.lat])
          .setPopup(popup)
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });
    }

    // 2. Citizen Report Markers
    if (activeLayers.reports) {
      reports.forEach(report => {
        const el = document.createElement('div');
        el.className = 'report-marker-pin';
        el.style.cursor = 'pointer';
        const isSevere = report.severity === 'Severe';
        const color = isSevere ? '#D9453D' : '#EE7B30';

        el.innerHTML = `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: ${color}; opacity: 0.3; animation: ping 2s infinite;"></div>
            <div style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background-color: ${color}; border: 2px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.2);"></div>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 14 }).setHTML(`
          <div style="text-align: left; min-width: 160px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: ${color};">${report.category.replace('_', ' ')}</span>
              <span style="font-size: 9px; color: #6F6A60;">${report.timestamp}</span>
            </div>
            <strong style="color: #1c1b1a; font-size: 11px; display: block; margin-bottom: 2px;">${report.location_name}</strong>
            <p style="color: #3f484b; font-size: 10px; margin-bottom: 4px; line-height: 1.3;">${report.description}</p>
            <div style="font-size: 10px; color: #4CAF7A; font-weight: 600;">
              👍 ${report.confirm_votes} neighbours confirmed
            </div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([report.lng, report.lat])
          .setPopup(popup)
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });
    }
  }, [shelters, reports, activeLayers.shelters, activeLayers.reports, mapLoaded]);

  const selectedWard = wards.find(w => w.properties.ward_id === selectedWardId) || wards[0];

  const horizonStepLabels = [
    getTranslation(currentLang, 'now_label'),
    getTranslation(currentLang, 'six_hours_label'),
    getTranslation(currentLang, 'twenty_four_hours_label'),
    getTranslation(currentLang, 'seventy_two_hours_label'),
  ];

  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 14.5,
        essential: true,
        duration: 1000
      });
    } else {
      alert('Click "Use My Location" in the search bar above to acquire your GPS coordinates.');
    }
  };

  return (
    <div className="w-full bg-[#FFFFFF] rounded-card border border-[#EADBCA] p-6 lg:p-8 shadow-level1" id="live-risk-map">
      {/* Top Map Header & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-[#EADBCA]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F7A8C] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            {getTranslation(currentLang, 'map_tag')}
          </span>
          <h3 className="font-heading text-xl lg:text-2xl font-bold text-[#1c1b1a]">
            {getTranslation(currentLang, 'map_title')}
          </h3>
          <p className="text-xs text-[#6F6A60] mt-0.5">
            Real interactive geographic basemap with street topology, live inundation contours, and verified safe havens.
          </p>
        </div>

        {/* LAYER TOGGLE PILLS (Glassmorphism & pill styles from PDF) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Basemap Switcher Pill */}
          <div className="flex items-center bg-[#F3EBDD] p-0.5 rounded-full border border-[#EADBCA] text-xs">
            <button
              type="button"
              onClick={() => setActiveBasemap('voyager')}
              className={`px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                activeBasemap === 'voyager'
                  ? 'bg-white text-[#1c1b1a] shadow-sm font-bold'
                  : 'text-[#6F6A60] hover:text-[#1c1b1a]'
              }`}
              title="Detailed Street Basemap"
            >
              Streets
            </button>
            <button
              type="button"
              onClick={() => setActiveBasemap('light')}
              className={`px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                activeBasemap === 'light'
                  ? 'bg-white text-[#1c1b1a] shadow-sm font-bold'
                  : 'text-[#6F6A60] hover:text-[#1c1b1a]'
              }`}
              title="Cream Light Neutral Basemap"
            >
              Cream
            </button>
            <button
              type="button"
              onClick={() => setActiveBasemap('osm')}
              className={`px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                activeBasemap === 'osm'
                  ? 'bg-white text-[#1c1b1a] shadow-sm font-bold'
                  : 'text-[#6F6A60] hover:text-[#1c1b1a]'
              }`}
              title="OpenStreetMap Standard"
            >
              OSM
            </button>
          </div>

          <button
            type="button"
            onClick={() => toggleLayer('flood')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
              activeLayers.flood
                ? 'bg-[#E3F1F4] text-[#006070] border-[#1F7A8C] shadow-sm'
                : 'bg-white text-[#6F6A60] border-[#EADBCA] hover:bg-[#F3EBDD]'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>{getTranslation(currentLang, 'layer_flood')}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('heat')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
              activeLayers.heat
                ? 'bg-[#FDEBD3] text-[#914d00] border-[#EE7B30] shadow-sm'
                : 'bg-white text-[#6F6A60] border-[#EADBCA] hover:bg-[#F3EBDD]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{getTranslation(currentLang, 'layer_heat')}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('drains')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
              activeLayers.drains
                ? 'bg-[#E0F7FA] text-[#006070] border-[#0097A7] shadow-sm font-bold'
                : 'bg-white text-[#6F6A60] border-[#EADBCA] hover:bg-[#F3EBDD]'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-[#0097A7]" />
            <span>Drains &amp; Nalas</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('shelters')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
              activeLayers.shelters
                ? 'bg-[#E6F5ED] text-[#4CAF7A] border-[#4CAF7A] shadow-sm'
                : 'bg-white text-[#6F6A60] border-[#EADBCA] hover:bg-[#F3EBDD]'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>{getTranslation(currentLang, 'layer_shelters')} ({shelters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('reports')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
              activeLayers.reports
                ? 'bg-[#FBE1DF] text-[#D9453D] border-[#D9453D] shadow-sm'
                : 'bg-white text-[#6F6A60] border-[#EADBCA] hover:bg-[#F3EBDD]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{getTranslation(currentLang, 'layer_reports')} ({reports.length})</span>
          </button>
        </div>
      </div>

      {/* MAP VIEWFINDER & CANVAS */}
      <div className="relative w-full h-[520px] rounded-2xl bg-[#FBF7EF] border border-[#EADBCA] mt-6 overflow-hidden flex shadow-inner">
        
        {/* Real MapLibre GL Interactive Container */}
        <div className="relative flex-1 h-full w-full">
          {/* WebGL Canvas Target */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />

          {/* Fallback if WebGL is unavailable */}
          {!webGlSupported && (
            <div className="absolute inset-0 bg-[#FBF7EF] p-8 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-10 h-10 text-[#EE7B30] mb-3" />
              <h4 className="font-heading font-bold text-base text-[#1c1b1a] mb-1">
                WebGL Acceleration Required for Interactive Map
              </h4>
              <p className="text-xs text-[#6F6A60] max-w-md mb-4">
                Your browser or environment does not support WebGL hardware rendering. Please enable hardware acceleration in your browser settings to explore live streets and vector layers.
              </p>
            </div>
          )}

          {/* Floating Floating Recenter Button on Map */}
          {userLocation && (
            <button
              type="button"
              onClick={handleCenterOnUser}
              title="Recenter map on your live GPS location"
              className="absolute top-4 right-14 z-10 p-2.5 rounded-full bg-white text-[#006070] hover:bg-[#E3F1F4] border border-[#EADBCA] shadow-level2 transition-all cursor-pointer flex items-center justify-center"
            >
              <Crosshair className="w-4 h-4 text-[#1F7A8C]" />
            </button>
          )}

          {/* Compass & Map Legend (Glassmorphism Pill) */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md rounded-2xl border border-[#EADBCA] p-3 shadow-level2 flex flex-col gap-2 text-xs">
            <span className="font-bold text-[#1c1b1a] flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#1F7A8C]" />
              {activeLayers.heat ? 'Urban Thermal Legend' : 'Hydrological Risk Legend'}
            </span>
            <div className="flex items-center gap-2.5 text-[11px] text-[#6F6A60]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9453D]"></span> {getTranslation(currentLang, 'risk_severe')}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EE7B30]"></span> {getTranslation(currentLang, 'risk_high')}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F2B134]"></span> {getTranslation(currentLang, 'risk_moderate')}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4CAF7A]"></span> {getTranslation(currentLang, 'risk_low')}
              </span>
            </div>
            {userLocation && (
              <div className="pt-1.5 border-t border-[#EADBCA] flex items-center gap-1.5 text-[10px] text-[#006070] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#006070] animate-ping" />
                <span>GPS Live: {userLocation.label || 'Your Location'}</span>
              </div>
            )}
          </div>
        </div>

        {/* SELECTED WARD DRAWER (SIDE PANEL) */}
        <div className="w-80 shrink-0 bg-[#FFFFFF] border-l border-[#EADBCA] p-5 flex flex-col justify-between hidden md:flex z-10 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F7A8C]">
                {selectedWard.properties.circle} • {selectedWard.properties.zone}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FBE1DF] text-[#D9453D]">
                {getTranslation(currentLang, selectedWard.properties.flood_level === 'Severe' ? 'risk_severe' : 'risk_high')}
              </span>
            </div>

            <h4 className="font-heading text-lg font-bold text-[#1c1b1a] mb-1">
              {selectedWard.properties.name}
            </h4>
            <span className="text-xs text-[#6F6A60] block mb-4">
              Population: {selectedWard.properties.population.toLocaleString()} | {selectedWard.properties.area_sqkm} sq.km
            </span>

            {/* Quick Metrics */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#FBF7EF] border border-[#EADBCA]">
                <span className="text-[#6F6A60]">{getTranslation(currentLang, 'base_elevation_label')}</span>
                <strong className="text-[#1c1b1a]">{selectedWard.properties.base_elevation_m}m MSL</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#FBF7EF] border border-[#EADBCA]">
                <span className="text-[#6F6A60]">{getTranslation(currentLang, 'drainage_status_label')}</span>
                <strong className="text-[#EE7B30]">{selectedWard.properties.drainage_health}</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#FBF7EF] border border-[#EADBCA]">
                <span className="text-[#6F6A60]">{getTranslation(currentLang, 'expected_depth_label')}</span>
                <strong className="text-[#D9453D]">{selectedWard.properties.flood_depth_cm || 25} cm</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#FBF7EF] border border-[#EADBCA]">
                <span className="text-[#6F6A60]">{getTranslation(currentLang, 'active_shelters_label')}</span>
                <strong className="text-[#4CAF7A]">{selectedWard.properties.active_shelters}</strong>
              </div>
            </div>

            {/* Action Notice */}
            <div className="mt-4 p-3 rounded-2xl bg-[#FDEBD3] border border-[#EE7B30]/30 text-[11px] text-[#914d00] leading-relaxed">
              <strong>{getTranslation(currentLang, 'ai_recommendation_tag')}</strong> Pre-position 2 mobile de-watering pumps at colony nala bridge.
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('monitor-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full py-2.5 rounded-full bg-[#1F7A8C] text-white text-xs font-semibold hover:bg-[#17606F] transition-colors text-center cursor-pointer shadow-sm"
          >
            {getTranslation(currentLang, 'inspect_telemetry_btn')}
          </button>
        </div>
      </div>

      {/* TIMELINE TIME SCRUBBER WITH PLAY/PAUSE */}
      <div className="mt-6 pt-4 border-t border-[#EADBCA] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1F7A8C] text-white hover:bg-[#17606F] text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? getTranslation(currentLang, 'pause_forecast') : getTranslation(currentLang, 'play_forecast')}</span>
          </button>
          <span className="text-xs text-[#6F6A60]">
            {getTranslation(currentLang, 'time_horizon_label')} <strong className="text-[#1c1b1a]">{horizonStepLabels[simulatedTimeStep]}</strong>
          </span>
        </div>

        {/* Steps Slider */}
        <div className="flex items-center gap-3 w-full sm:w-72">
          <span className="text-[11px] font-semibold text-[#6F6A60]">Now</span>
          <input
            type="range"
            min="0"
            max="3"
            value={simulatedTimeStep}
            onChange={(e) => onTimeStepChange(Number(e.target.value))}
            className="w-full accent-[#1F7A8C] h-2 bg-[#F3EBDD] rounded-lg cursor-pointer"
          />
          <span className="text-[11px] font-semibold text-[#6F6A60]">+72h</span>
        </div>
      </div>

      {/* Micro-watershed Modeling Disclaimer */}
      <p className="mt-3 text-[11px] text-[#8F8A80] text-center sm:text-left italic">
        * Micro-watershed boundaries represent pilot hydrologic modeling zones. Follow local emergency personnel for official evacuation routes.
      </p>
    </div>
  );
};
