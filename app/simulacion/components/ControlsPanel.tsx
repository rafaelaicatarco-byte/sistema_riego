'use client';

import { PUMPS, IRRIGATION, SOILS } from '../constants';

interface ControlsPanelProps {
  pumpKey: string;
  irrigKey: string;
  plantKey: string;
  soilKey: string;
  lm2: number;
  low: number;
  high: number;
  speed: number;
  running: boolean;
  onPumpChange: (v: string) => void;
  onIrrigChange: (v: string) => void;
  onPlantChange: (v: string) => void;
  onSoilChange: (v: string) => void;
  onLm2Change: (v: number) => void;
  onLowChange: (v: number) => void;
  onHighChange: (v: number) => void;
  onSpeedChange: (v: number) => void;
  onStartStop: () => void;
  onReset: () => void;
}

export default function ControlsPanel({
  pumpKey, irrigKey, plantKey, soilKey, lm2, low, high, speed, running,
  onPumpChange, onIrrigChange, onPlantChange, onSoilChange,
  onLm2Change, onLowChange, onHighChange, onSpeedChange,
  onStartStop, onReset,
}: ControlsPanelProps) {
  return (
    <div className="bg-[#1B2420] border border-[#2C3B33] rounded-xl p-[18px]">
      <h2 className="font-['Space_Grotesk'] text-[13px] uppercase tracking-[.08em] m-0 mb-3.5 text-[#8FA398] flex items-center gap-2 before:content-[''] before:w-[5px] before:h-[5px] before:bg-[#3FA7D6] before:rotate-45">
        Controles del sistema
      </h2>

      {/* Tipo de riego */}
      <label className="block text-[11.5px] text-[#8FA398] mb-1 uppercase tracking-[.05em]">Tipo de riego</label>
      <select
        value={irrigKey}
        onChange={(e) => onIrrigChange(e.target.value)}
        className="w-full bg-[#212C27] border border-[#2C3B33] text-[#E7EEE9] px-2.5 py-[9px] rounded-lg font-['Inter'] text-[13px] mb-3"
      >
        {Object.entries(IRRIGATION).map(([k, v]) => (
          <option key={k} value={k}>{v.name}</option>
        ))}
      </select>

      {/* Bomba */}
      <label className="block text-[11.5px] text-[#8FA398] mb-1 uppercase tracking-[.05em]">Bomba de agua (relé → GPIO26)</label>
      <select
        value={pumpKey}
        onChange={(e) => onPumpChange(e.target.value)}
        className="w-full bg-[#212C27] border border-[#2C3B33] text-[#E7EEE9] px-2.5 py-[9px] rounded-lg font-['Inter'] text-[13px] mb-3"
      >
        {Object.entries(PUMPS).map(([k, v]) => (
          <option key={k} value={k}>{v.name} — {v.flow} L/min</option>
        ))}
      </select>

      {/* Planta */}
      <label className="block text-[11.5px] text-[#8FA398] mb-1 uppercase tracking-[.05em]">Tipo de planta sembrada</label>
      <select
        value={plantKey}
        onChange={(e) => onPlantChange(e.target.value)}
        className="w-full bg-[#212C27] border border-[#2C3B33] text-[#E7EEE9] px-2.5 py-[9px] rounded-lg font-['Inter'] text-[13px] mb-3"
      >
        <optgroup label="🍓 Frutas">
          <option value="fresa">Fresa</option>
          <option value="sandia">Sandía</option>
          <option value="melon">Melón</option>
        </optgroup>
        <optgroup label="🌱 Legumbres">
          <option value="frijol">Frijol</option>
          <option value="lenteja">Lenteja</option>
          <option value="arveja">Arveja</option>
        </optgroup>
        <optgroup label="🥬 Vegetales">
          <option value="lechuga">Lechuga</option>
          <option value="zanahoria">Zanahoria</option>
          <option value="pimiento">Pimiento</option>
          <option value="cebolla">Cebolla</option>
        </optgroup>
      </select>

      {/* Tierra */}
      <label className="block text-[11.5px] text-[#8FA398] mb-1 uppercase tracking-[.05em]">Tipo de tierra</label>
      <select
        value={soilKey}
        onChange={(e) => onSoilChange(e.target.value)}
        className="w-full bg-[#212C27] border border-[#2C3B33] text-[#E7EEE9] px-2.5 py-[9px] rounded-lg font-['Inter'] text-[13px] mb-3"
      >
        {Object.entries(SOILS).map(([k, v]) => (
          <option key={k} value={k}>{v.name} — {k === 'arenoso' ? 'drena rápido' : k === 'franco' ? 'equilibrada' : 'retiene agua'}</option>
        ))}
      </select>

      {/* L/m² range */}
      <label className="block text-[11.5px] text-[#8FA398] mb-1 uppercase tracking-[.05em]">
        Requerimiento de riego
        <span className="font-['JetBrains_Mono'] text-xs text-[#3FA7D6] float-right">{lm2} L/m²</span>
      </label>
      <input
        type="range"
        min={2}
        max={10}
        step={0.5}
        value={lm2}
        onChange={(e) => onLm2Change(parseFloat(e.target.value))}
        className="w-full mb-3 accent-[#3FA7D6]"
      />

      {/* Umbrales */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div>
          <label className="block text-[11.5px] text-[#8FA398] mb-1 uppercase tracking-[.05em]">Umbral ON (seco)</label>
          <input
            type="number"
            value={low}
            min={5}
            max={60}
            onChange={(e) => onLowChange(parseFloat(e.target.value))}
            className="w-full bg-[#212C27] border border-[#2C3B33] text-[#E7EEE9] px-2.5 py-[9px] rounded-lg font-['Inter'] text-[13px]"
          />
        </div>
        <div>
          <label className="block text-[11.5px] text-[#8FA398] mb-1 uppercase tracking-[.05em]">Umbral OFF (húmedo)</label>
          <input
            type="number"
            value={high}
            min={40}
            max={95}
            onChange={(e) => onHighChange(parseFloat(e.target.value))}
            className="w-full bg-[#212C27] border border-[#2C3B33] text-[#E7EEE9] px-2.5 py-[9px] rounded-lg font-['Inter'] text-[13px]"
          />
        </div>
      </div>

      {/* Velocidad */}
      <label className="block text-[11.5px] text-[#8FA398] mb-1 uppercase tracking-[.05em]">Velocidad de simulación</label>
      <select
        value={speed}
        onChange={(e) => onSpeedChange(parseInt(e.target.value))}
        className="w-full bg-[#212C27] border border-[#2C3B33] text-[#E7EEE9] px-2.5 py-[9px] rounded-lg font-['Inter'] text-[13px] mb-3"
      >
        <option value={1}>×1 (1 min/paso)</option>
        <option value={5}>×5 (5 min/paso)</option>
        <option value={15}>×15 (15 min/paso)</option>
        <option value={60}>×60 (1 h/paso)</option>
      </select>

      {/* Botones */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onStartStop}
          className={`flex-1 font-['Space_Grotesk'] font-semibold text-[13px] py-[11px] px-2.5 rounded-lg border cursor-pointer transition-[transform,filter] duration-100 active:scale-[.97] ${
            running
              ? 'bg-[#E2574C] text-[#2A0B08] border-transparent hover:brightness-105'
              : 'bg-[#59C36A] text-[#0B1A10] border-transparent hover:brightness-105'
          }`}
        >
          {running ? '⏸ Pausar' : '▶ Iniciar'}
        </button>
        <button
          onClick={onReset}
          className="flex-1 font-['Space_Grotesk'] font-semibold text-[13px] py-[11px] px-2.5 rounded-lg border border-[#2C3B33] bg-[#212C27] text-[#E7EEE9] cursor-pointer transition-[transform,filter] duration-100 active:scale-[.97] hover:brightness-105"
        >
          ⟲ Reset
        </button>
      </div>
    </div>
  );
}
