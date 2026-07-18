'use client';

function lerpColor(c1: string, c2: string, t: number) {
  const a = parseInt(c1.slice(1), 16);
  const b = parseInt(c2.slice(1), 16);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function adcFromMoisture(m: number) {
  return Math.round(4095 - (m / 100) * (4095 - 1200));
}

function fmtClock(totalMin: number) {
  const h = Math.floor(totalMin / 60);
  const m = Math.floor(totalMin % 60);
  const s = Math.floor((totalMin * 60) % 60);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
}

interface TerrainPanelProps {
  moisture: number;
  simMinutes: number;
  cellOffsets: number[];
}

export default function TerrainPanel({ moisture, simMinutes, cellOffsets }: TerrainPanelProps) {
  const m = Math.round(moisture);
  const gaugeDeg = m * 3.6;

  return (
    <div className="bg-[#1B2420] border border-[#2C3B33] rounded-xl p-[18px]">
      <h2 className="font-['Space_Grotesk'] text-[13px] uppercase tracking-[.08em] m-0 mb-3.5 text-[#8FA398] flex items-center gap-2 before:content-[''] before:w-[5px] before:h-[5px] before:bg-[#3FA7D6] before:rotate-45">
        Terreno &amp; sensor de humedad (capacitivo)
      </h2>

      <div className="flex gap-[18px] flex-wrap items-start">
        {/* Terrain grid */}
        <div className="flex-1 min-w-[220px] grid grid-cols-8 gap-1">
          {cellOffsets.map((offset, i) => {
            const cm = Math.min(100, Math.max(0, moisture + offset));
            return (
              <div
                key={i}
                className="aspect-square rounded-[3px] transition-colors duration-[600ms]"
                style={{ backgroundColor: lerpColor('#8B5E3C', '#2F7D4F', cm / 100) }}
              />
            );
          })}
        </div>

        {/* Gauge */}
        <div className="flex flex-col items-center gap-1.5 w-[150px]">
          <div
            className="w-[130px] h-[130px] rounded-full flex items-center justify-center relative"
            style={{
              background: `conic-gradient(#D98E3B 0deg, #D98E3B ${gaugeDeg}deg, #2A362F ${gaugeDeg}deg)`,
            }}
          >
            <div className="absolute w-[96px] h-[96px] rounded-full bg-[#1B2420]" />
            <span className="relative font-['JetBrains_Mono'] text-[22px] font-bold text-[#E7EEE9]">{m}%</span>
          </div>
          <div className="text-[11px] text-[#8FA398] text-center">
            Humedad de suelo<br />(promedio del terreno)
          </div>
        </div>
      </div>

      <div className="mt-3.5 font-['JetBrains_Mono'] text-xs text-[#8FA398] border-t border-dashed border-[#2C3B33] pt-2.5">
        Lectura ADC (GPIO34): <b className="text-[#3FA7D6]">{adcFromMoisture(moisture)}</b> / 4095 &nbsp;·&nbsp;
        <span className="text-[#3FA7D6]">{fmtClock(simMinutes)}</span> tiempo simulado
      </div>
    </div>
  );
}
