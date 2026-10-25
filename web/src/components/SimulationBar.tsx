'use client';

import React from 'react';
import { Sliders, CloudRain, Sun, Play, RotateCcw, Sparkles } from 'lucide-react';

interface SimulationBarProps {
  rainfallRate: number;
  onRainfallChange: (val: number) => void;
  temperatureC: number;
  onTemperatureChange: (val: number) => void;
  onRunHeavyRainScenario: () => void;
  onRunHeatwaveScenario: () => void;
  onResetScenario: () => void;
  isScenarioActive: boolean;
}

export const SimulationBar: React.FC<SimulationBarProps> = ({
  rainfallRate,
  onRainfallChange,
  temperatureC,
  onTemperatureChange,
  onRunHeavyRainScenario,
  onRunHeatwaveScenario,
  onResetScenario,
  isScenarioActive
}) => {
  return (
    <div className="w-full bg-[#FFFFFF] rounded-2xl border border-[#EADBCA] p-4 lg:p-6 shadow-level1 mb-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Sliders Area */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Rain Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#1c1b1a] flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-[#1F7A8C]" />
                What-If Rainfall Intensity:
              </span>
              <span className="font-heading font-black text-sm text-[#006070] bg-[#E3F1F4] px-2 py-0.5 rounded-full">
                {rainfallRate} mm/hr
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="5"
              value={rainfallRate}
              onChange={(e) => onRainfallChange(Number(e.target.value))}
              className="w-full accent-[#1F7A8C] h-2 bg-[#F3EBDD] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#6F6A60] mt-1">
              <span>0 (Dry)</span>
              <span>35 (Moderate)</span>
              <span>70 (Downpour)</span>
              <span>120 (Cloudburst)</span>
            </div>
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#1c1b1a] flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-[#EE7B30]" />
                What-If Ambient Temp:
              </span>
              <span className="font-heading font-black text-sm text-[#EE7B30] bg-[#FDEBD3] px-2 py-0.5 rounded-full">
                {temperatureC}°C
              </span>
            </div>
            <input
              type="range"
              min="25"
              max="48"
              step="1"
              value={temperatureC}
              onChange={(e) => onTemperatureChange(Number(e.target.value))}
              className="w-full accent-[#EE7B30] h-2 bg-[#F3EBDD] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#6F6A60] mt-1">
              <span>25°C</span>
              <span>35°C</span>
              <span>42°C (Heatwave)</span>
              <span>48°C (Extreme)</span>
            </div>
          </div>
        </div>

        {/* Scripted Demo Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onRunHeavyRainScenario}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
              isScenarioActive
                ? 'bg-[#D9453D] text-white animate-pulse'
                : 'bg-[#1F7A8C] hover:bg-[#17606F] text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate Heavy Rain in Hyderabad</span>
          </button>

          <button
            onClick={onRunHeatwaveScenario}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F3EBDD] hover:bg-[#EADBCA] text-[#914d00] text-xs font-bold transition-all border border-[#EADBCA]"
          >
            <Sun className="w-3.5 h-3.5 text-[#EE7B30]" />
            <span>Simulate Heatwave</span>
          </button>

          <button
            onClick={onResetScenario}
            className="p-2 rounded-full bg-[#FFFFFF] hover:bg-[#F3EBDD] text-[#6F6A60] border border-[#EADBCA] transition-all"
            title="Reset to baseline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
