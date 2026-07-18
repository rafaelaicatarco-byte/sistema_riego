'use client';

import { PUMPS, SOILS, IRRIGATION, AREA, TANK_CAPACITY } from '../constants';

interface CalculationsPanelProps {
  pumpKey: string;
  irrigKey: string;
  soilKey: string;
  lm2: number;
  low: number;
  high: number;
}

function fmtLiters(n: number) {
  return Math.round(n).toLocaleString('es-EC') + ' L';
}

function fmtDuration(mins: number) {
  if (!isFinite(mins)) return '—';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

export default function CalculationsPanel({ pumpKey, irrigKey, soilKey, lm2, low, high }: CalculationsPanelProps) {
  const pump = PUMPS[pumpKey];
  const soil = SOILS[soilKey];
  const irrig = IRRIGATION[irrigKey];
  const effFlow = pump.flow * irrig.flowFactor;
  const combinedEff = soil.efficiency * irrig.efficiency;
  const totalL = (AREA * lm2) / combinedEff;
  const timeMin = totalL / effFlow;
  const cycles = TANK_CAPACITY / totalL;
  const emptyMin = TANK_CAPACITY / effFlow;
  const energyPerCycle = (pump.power / 1000) * (timeMin / 60);

  const cards = [
    { label: 'Agua para riego completo', value: fmtLiters(totalL) },
    { label: 'Tiempo de riego completo', value: fmtDuration(timeMin) },
    { label: 'Riegos completos por tanque lleno', value: cycles.toFixed(2) + ' riegos' },
    { label: 'Caudal por m²', value: (effFlow / AREA).toFixed(3) + ' L/min·m²' },
    { label: 'Tiempo en vaciar el tanque', value: fmtDuration(emptyMin) },
    { label: 'Consumo energético / riego', value: energyPerCycle.toFixed(2) + ' kWh' },
    { label: 'Caudal efectivo (según riego)', value: effFlow.toFixed(1) + ' L/min' },
    { label: 'Eficiencia total (suelo + riego)', value: Math.round(combinedEff * 100) + '%' },
  ];

  return (
    <div className="bg-[#1B2420] border border-[#2C3B33] rounded-xl p-[18px] mb-4">
      <h2 className="font-['Space_Grotesk'] text-[13px] uppercase tracking-[.08em] m-0 mb-3.5 text-[#8FA398] flex items-center gap-2 before:content-[''] before:w-[5px] before:h-[5px] before:bg-[#3FA7D6] before:rotate-45">
        Cálculos del sistema (según bomba seleccionada)
      </h2>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        {cards.map((card, i) => (
          <div key={i} className="bg-[#212C27] border border-[#2C3B33] rounded-[10px] p-3">
            <div className="text-[11px] text-[#8FA398] uppercase tracking-[.05em]">{card.label}</div>
            <div className="font-['JetBrains_Mono'] text-[19px] font-bold text-[#3FA7D6] mt-1">{card.value}</div>
          </div>
        ))}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-[#8FA398] text-[12.5px] font-['JetBrains_Mono'] hover:text-[#E7EEE9] transition-colors">
          Ver lógica equivalente en código Arduino (ESP32) ▾
        </summary>
        <pre className="bg-[#0A0E0B] border border-[#2C3B33] rounded-[10px] p-3.5 font-['JetBrains_Mono'] text-xs leading-relaxed text-[#B9E6C4] overflow-x-auto mt-2.5">
          <span style={{ color: '#5C7A68' }}>// Sensor capacitivo de humedad + relé + bomba</span>
          {'\n'}
          <span style={{ color: '#3FA7D6' }}>#define</span> <span style={{ color: '#D98E3B' }}>SOIL_PIN</span>   34   <span style={{ color: '#5C7A68' }}>// ADC1_CH6 (entrada analógica)</span>
          {'\n'}
          <span style={{ color: '#3FA7D6' }}>#define</span> <span style={{ color: '#D98E3B' }}>RELAY_PIN</span> 26   <span style={{ color: '#5C7A68' }}>// controla la bomba</span>
          {'\n\n'}
          <span style={{ color: '#3FA7D6' }}>int</span> umbralBajo  = {low};   <span style={{ color: '#5C7A68' }}>// % humedad -&gt; enciende bomba</span>
          {'\n'}
          <span style={{ color: '#3FA7D6' }}>int</span> umbralAlto  = {high};   <span style={{ color: '#5C7A68' }}>// % humedad -&gt; apaga bomba</span>
          {'\n\n'}
          <span style={{ color: '#3FA7D6' }}>void</span> <span style={{ color: '#D98E3B' }}>setup</span>() {'{'}
          {'\n'}  Serial.<span style={{ color: '#D98E3B' }}>begin</span>(115200);
          {'\n'}  pinMode(RELAY_PIN, OUTPUT);
          {'\n'}  digitalWrite(RELAY_PIN, LOW);
          {'\n'}
          {'}'}{'\n\n'}
          <span style={{ color: '#3FA7D6' }}>void</span> <span style={{ color: '#D98E3B' }}>loop</span>() {'{'}
          {'\n'}  <span style={{ color: '#3FA7D6' }}>int</span> lectura  = analogRead(SOIL_PIN);              <span style={{ color: '#5C7A68' }}>// 0-4095</span>
          {'\n'}  <span style={{ color: '#3FA7D6' }}>int</span> humedad  = map(lectura, 4095, 1200, 0, 100); <span style={{ color: '#5C7A68' }}>// invertido</span>
          {'\n\n'}  Serial.printf("Humedad: %d%% | ADC: %d\\n", humedad, lectura);
          {'\n\n'}  <span style={{ color: '#3FA7D6' }}>if</span> (humedad &lt;= umbralBajo) {'{'}
          {'\n'}    digitalWrite(RELAY_PIN, HIGH);   <span style={{ color: '#5C7A68' }}>// activa la bomba</span>
          {'\n'}  {'}'} <span style={{ color: '#3FA7D6' }}>else if</span> (humedad &gt;= umbralAlto) {'{'}
          {'\n'}    digitalWrite(RELAY_PIN, LOW);    <span style={{ color: '#5C7A68' }}>// detiene la bomba</span>
          {'\n'}  {'}'}
          {'\n'}  delay(2000);
          {'\n'}
          {'}'}
        </pre>
      </details>
    </div>
  );
}
