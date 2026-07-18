'use client';

import { TANK_CAPACITY } from '../constants';

interface TankPanelProps {
  tank: number;
  fillValveOn: boolean;
}

function fmtLiters(n: number) {
  return Math.round(n).toLocaleString('es-EC') + ' L';
}

export default function TankPanel({ tank, fillValveOn }: TankPanelProps) {
  const pct = (tank / TANK_CAPACITY) * 100;
  const h = 140 * (pct / 100);
  const waterColor = pct < 15 ? '#D98E3B' : '#3FA7D6';

  return (
    <div className="bg-[#1B2420] border border-[#2C3B33] rounded-xl p-[18px]">
      <h2 className="font-['Space_Grotesk'] text-[13px] uppercase tracking-[.08em] m-0 mb-3.5 text-[#8FA398] flex items-center gap-2 before:content-[''] before:w-[5px] before:h-[5px] before:bg-[#3FA7D6] before:rotate-45">
        Tanque de agua
      </h2>
      <div className="flex flex-col items-center gap-3.5">
        <svg className="w-[120px]" viewBox="0 0 100 160">
          <rect x="10" y="8" width="80" height="144" rx="8" fill="#0F1613" stroke="#3A4A40" strokeWidth="2" />
          <clipPath id="tankClip">
            <rect x="12" y="10" width="76" height="140" rx="6" />
          </clipPath>
          <rect x="12" y={150 - h} width="76" height={h} fill={waterColor} clipPath="url(#tankClip)" />
          <line x1="10" y1="45" x2="4" y2="45" stroke="#556B5E" strokeWidth="1.5" />
          <line x1="10" y1="82" x2="4" y2="82" stroke="#556B5E" strokeWidth="1.5" />
          <line x1="10" y1="118" x2="4" y2="118" stroke="#556B5E" strokeWidth="1.5" />
        </svg>
        <div className="font-['JetBrains_Mono'] text-[26px] font-bold text-[#3FA7D6]">{Math.round(pct)}%</div>
        <div className="font-['JetBrains_Mono'] text-[12.5px] text-[#8FA398]">
          {fmtLiters(tank)} / {fmtLiters(TANK_CAPACITY)}
        </div>
        <div className="w-full flex justify-between text-xs text-[#8FA398] border-t border-dashed border-[#2C3B33] pt-2 mt-0.5">
          <span>Cap. total</span>            <b className="text-[#E7EEE9] font-['JetBrains_Mono'] font-medium">{TANK_CAPACITY.toLocaleString('es-EC')} L</b>
        </div>
        <div className="w-full flex justify-between text-xs text-[#8FA398] border-t border-dashed border-[#2C3B33] pt-2 mt-0.5">
          <span>Terreno</span>
          <b className="text-[#E7EEE9] font-['JetBrains_Mono'] font-medium">4.000 m²</b>
        </div>
        <div className="w-full flex justify-between text-xs text-[#8FA398] border-t border-dashed border-[#2C3B33] pt-2 mt-0.5">
          <span>Válvula (≤20%)</span>
          <b className="text-[#E7EEE9] font-['JetBrains_Mono'] font-medium">{fillValveOn ? 'Abierta ●' : 'Cerrada'}</b>
        </div>
      </div>
    </div>
  );
}
