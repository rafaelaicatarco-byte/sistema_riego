'use client';

import TankPanel from './TankPanel';
import TerrainPanel from './TerrainPanel';
import ControlsPanel from './ControlsPanel';

interface DashboardProps {
  pumpKey: string;
  irrigKey: string;
  plantKey: string;
  soilKey: string;
  lm2: number;
  low: number;
  high: number;
  speed: number;
  running: boolean;
  tank: number;
  moisture: number;
  simMinutes: number;
  fillValveOn: boolean;
  pumpOn: boolean;
  cellOffsets: number[];
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
  onLogout: () => void;
}

export default function Dashboard(props: DashboardProps) {
  const {
    pumpKey, irrigKey, plantKey, soilKey, lm2, low, high, speed,
    running, tank, moisture, simMinutes, fillValveOn, pumpOn, cellOffsets,
    onPumpChange, onIrrigChange, onPlantChange, onSoilChange,
    onLm2Change, onLowChange, onHighChange, onSpeedChange,
    onStartStop, onReset, onLogout,
  } = props;

  const statusPills = [
    { color: running ? 'on' : 'off', label: `SISTEMA: ${running ? 'EN EJECUCIÓN' : 'DETENIDO'}` },
    { color: pumpOn ? 'on' : 'off', label: `RELÉ: ${pumpOn ? 'HIGH' : 'LOW'}` },
    { color: pumpOn ? 'on' : tank <= 0 ? 'warn' : 'off', label: `BOMBA: ${pumpOn ? 'ON' : 'OFF'}` },
    { color: fillValveOn ? 'on' : 'off', label: `VÁLVULA LLENADO: ${fillValveOn ? 'ABIERTA' : 'CERRADA'}` },
  ];

  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-end flex-wrap gap-4 border-b border-[#2C3B33] pb-[18px] mb-[22px]">
        <div>
          <div className="font-['JetBrains_Mono'] text-xs tracking-[.14em] text-[#3FA7D6] uppercase mb-1.5">
            Simulación · ESP32 · Riego automatizado
          </div>
          <h1 className="font-['Space_Grotesk'] text-[30px] m-0 font-bold tracking-[-.01em]">
            Panel de Control de <span className="text-[#59C36A]">Riego</span>
          </h1>
          <div className="text-[#8FA398] text-[13.5px] mt-1.5 max-w-[520px]">
            Tanque de 20.000&nbsp;L · Terreno de 4.000&nbsp;m² · Sensor capacitivo de humedad + relé + bomba, replicando la lógica real de un ESP32.
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusPills.map((pill, i) => (
            <div
              key={i}
              className="font-['JetBrains_Mono'] text-[11.5px] px-3 py-1.5 rounded-full border border-[#2C3B33] bg-[#1B2420] flex items-center gap-[7px]"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  pill.color === 'on'
                    ? 'bg-[#59C36A] shadow-[0_0_8px_#59C36A]'
                    : pill.color === 'warn'
                    ? 'bg-[#E2574C] shadow-[0_0_8px_#E2574C]'
                    : 'bg-[#8FA398]'
                }`}
              />
              {pill.label}
            </div>
          ))}
          <div className="font-['JetBrains_Mono'] text-[11.5px] px-3 py-1.5 rounded-full border border-[#2C3B33] bg-[#1B2420] flex items-center">
            <button onClick={onLogout} className="cursor-pointer bg-transparent border-none text-inherit font-inherit text-inherit p-0 hover:text-white transition-colors">
              ⏻ Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-[230px_1fr_300px] gap-4 mb-4 max-[900px]:grid-cols-1">
        <TankPanel tank={tank} fillValveOn={fillValveOn} />
        <TerrainPanel moisture={moisture} simMinutes={simMinutes} cellOffsets={cellOffsets} />
        <ControlsPanel
          pumpKey={pumpKey}
          irrigKey={irrigKey}
          plantKey={plantKey}
          soilKey={soilKey}
          lm2={lm2}
          low={low}
          high={high}
          speed={speed}
          running={running}
          onPumpChange={onPumpChange}
          onIrrigChange={onIrrigChange}
          onPlantChange={onPlantChange}
          onSoilChange={onSoilChange}
          onLm2Change={onLm2Change}
          onLowChange={onLowChange}
          onHighChange={onHighChange}
          onSpeedChange={onSpeedChange}
          onStartStop={onStartStop}
          onReset={onReset}
        />
      </div>
    </>
  );
}
