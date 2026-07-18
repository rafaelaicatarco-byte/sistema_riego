'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import CalculationsPanel from './components/CalculationsPanel';
import SerialMonitor, { type LogEntry } from './components/SerialMonitor';
import {
  PUMPS, PLANTS, IRRIGATION, SOILS,
  TANK_CAPACITY, AREA, FILL_RATE,
  VALVE_OPEN_PCT, VALVE_CLOSE_PCT,
} from './constants';

function fmtClock(totalMin: number) {
  const h = Math.floor(totalMin / 60);
  const m = Math.floor(totalMin % 60);
  const s = Math.floor((totalMin * 60) % 60);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
}

function fmtLiters(n: number) {
  return Math.round(n).toLocaleString('es-EC') + ' L';
}

export default function SimulacionClient() {
  // --- Auth state ---
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authModal, setAuthModal] = useState({ visible: false, ok: false, title: '', message: '' });

  // --- Simulation state ---
  const [tank, setTank] = useState(TANK_CAPACITY);
  const [moisture, setMoisture] = useState(32);
  const [pumpOn, setPumpOn] = useState(false);
  const [fillValveOn, setFillValveOn] = useState(false);
  const [running, setRunning] = useState(false);
  const [simMinutes, setSimMinutes] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cellOffsets] = useState<number[]>(() =>
    Array.from({ length: 40 }, () => (Math.random() * 16) - 8)
  );

  // --- Controls state ---
  const [pumpKey, setPumpKey] = useState('p2');
  const [irrigKey, setIrrigKey] = useState('aspersion');
  const [plantKey, setPlantKey] = useState('frijol');
  const [soilKey, setSoilKey] = useState('franco');
  const [lm2, setLm2] = useState(5);
  const [low, setLow] = useState(30);
  const [high, setHigh] = useState(65);
  const [speed, setSpeed] = useState(5);

  // --- Refs for simulation tick ---
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef({
    tank, moisture, pumpOn, fillValveOn, running, simMinutes,
    pumpKey, irrigKey, soilKey, lm2, low, high, speed, logs,
  });
  stateRef.current = {
    tank, moisture, pumpOn, fillValveOn, running, simMinutes,
    pumpKey, irrigKey, soilKey, lm2, low, high, speed, logs,
  };

  // --- Utility to add log (definido ANTES del useEffect que lo usa) ---
  const addLog = useCallback((msg: string, cls?: 'evt' | 'warn') => {
    setLogs((prev) => {
      const time = fmtClock(stateRef.current.simMinutes);
      const next = [...prev, { time, msg, cls }];
      return next.length > 200 ? next.slice(-200) : next;
    });
  }, []);

  // --- Check if already authenticated on mount ---
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          setLoggedIn(true);
          addLog('Sesión verificada — bienvenido de vuelta', 'evt');
          addLog('ESP32 listo — esperando inicio del sistema (Serial.begin(115200))', 'evt');
          addLog(`Configuración inicial: ${PLANTS[plantKey].name} (${PLANTS[plantKey].cat}) sobre tierra ${SOILS[soilKey].name.toLowerCase()}, riego por ${IRRIGATION[irrigKey].name.toLowerCase()}`, 'evt');
        }
      } catch {
        // No autenticado, mostrar login
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLog]);

  // --- Tick function ---
  const tick = useCallback(() => {
    const s = stateRef.current;
    const newMinutes = s.simMinutes + s.speed;
    const pump = PUMPS[s.pumpKey];
    const soil = SOILS[s.soilKey];
    const irrig = IRRIGATION[s.irrigKey];
    const effFlow = pump.flow * irrig.flowFactor;

    let newPumpOn = s.pumpOn;
    let newTank = s.tank;
    let newMoisture = s.moisture;
    let newFillValveOn = s.fillValveOn;
    const newLogs: LogEntry[] = [];

    // --- Relay logic ---
    if (!s.pumpOn && s.moisture <= s.low) {
      newPumpOn = true;
      newLogs.push({ time: fmtClock(newMinutes), msg: `Umbral inferior (${s.low}%) alcanzado`, cls: 'evt' });
      newLogs.push({ time: fmtClock(newMinutes), msg: `Relé activado (GPIO26 = HIGH) -> Bomba: ${pump.name}`, cls: 'evt' });
    } else if (s.pumpOn && (s.moisture >= s.high || s.tank <= 0)) {
      newPumpOn = false;
      if (s.tank <= 0) {
        newLogs.push({ time: fmtClock(newMinutes), msg: 'Tanque sin agua disponible — deteniendo bomba', cls: 'warn' });
      } else {
        newLogs.push({ time: fmtClock(newMinutes), msg: `Humedad objetivo (${s.high}%) alcanzada`, cls: 'evt' });
      }
      newLogs.push({ time: fmtClock(newMinutes), msg: 'Relé desactivado (GPIO26 = LOW)', cls: 'evt' });
    }

    // --- Fill valve ---
    if (!s.fillValveOn && s.tank <= TANK_CAPACITY * VALVE_OPEN_PCT) {
      newFillValveOn = true;
      newLogs.push({ time: fmtClock(newMinutes), msg: `Nivel de tanque ≤ ${Math.round(VALVE_OPEN_PCT * 100)}% — abriendo válvula de llenado (GPIO25 = HIGH)`, cls: 'evt' });
    } else if (s.fillValveOn && s.tank >= TANK_CAPACITY * VALVE_CLOSE_PCT) {
      newFillValveOn = false;
      newLogs.push({ time: fmtClock(newMinutes), msg: 'Tanque casi lleno — cerrando válvula de llenado (GPIO25 = LOW)', cls: 'evt' });
    }
    if (newFillValveOn) {
      const filled = Math.min(FILL_RATE * s.speed, TANK_CAPACITY - newTank);
      newTank += filled;
    }

    // --- Soil moisture balance ---
    if (newPumpOn) {
      let used = effFlow * s.speed;
      used = Math.min(used, newTank);
      newTank -= used;
      const totalForFull = (AREA * s.lm2) / (soil.efficiency * irrig.efficiency);
      const gain = (used / totalForFull) * 100;
      newMoisture = Math.min(100, newMoisture + gain);
      if (newTank <= 0) newTank = 0;
    } else {
      newMoisture = Math.max(0, newMoisture - 0.12 * s.speed * soil.evapMult);
    }

    const adc = Math.round(4095 - (newMoisture / 100) * (4095 - 1200));
    newLogs.push({
      time: fmtClock(newMinutes),
      msg: `Humedad: ${Math.round(newMoisture)}% | ADC: ${adc} | Riego: ${irrig.name} | Suelo: ${soil.name} | Bomba: ${newPumpOn ? 'ON' : 'OFF'} | Tanque: ${fmtLiters(newTank)} (${Math.round(newTank / TANK_CAPACITY * 100)}%)`,
    });

    // Apply all state updates
    setTank(newTank);
    setMoisture(newMoisture);
    setPumpOn(newPumpOn);
    setFillValveOn(newFillValveOn);
    setSimMinutes(newMinutes);
    setLogs((prev) => {
      const next = [...prev, ...newLogs];
      return next.length > 200 ? next.slice(-200) : next;
    });
  }, []);

  // --- Start/stop simulation ---
  const handleStartStop = useCallback(() => {
    if (running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      addLog('=== Sistema pausado ===', 'evt');
    } else {
      setRunning(true);
      addLog('=== Sistema iniciado (setup() ejecutado) ===', 'evt');
      addLog(`Parámetros: umbral ON ${low}% · umbral OFF ${high}% · ${lm2} L/m²`, 'evt');
      intervalRef.current = setInterval(tick, 450);
    }
  }, [running, low, high, lm2, addLog, tick]);

  // --- Reset ---
  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setTank(TANK_CAPACITY);
    setMoisture(32);
    setPumpOn(false);
    setFillValveOn(false);
    setSimMinutes(0);
    setLogs([]);
    addLog('Sistema reiniciado — tanque lleno, sensores reinicializados', 'evt');
  }, [addLog]);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // --- Plant change sets defaults ---
  const handlePlantChange = useCallback((v: string) => {
    setPlantKey(v);
    const plant = PLANTS[v];
    setLm2(plant.lm2);
    setLow(plant.low);
    setHigh(plant.high);
    addLog(`Cultivo seleccionado: ${plant.name} (${plant.cat}) — requerimiento ${plant.lm2} L/m², humedad ideal ${plant.low}%–${plant.high}%`, 'evt');
  }, [addLog]);

  // --- Irrigation change ---
  const handleIrrigChange = useCallback((v: string) => {
    setIrrigKey(v);
    const irrig = IRRIGATION[v];
    addLog(`Sistema de riego: ${irrig.name} (eficiencia ${Math.round(irrig.efficiency * 100)}%, caudal efectivo ×${irrig.flowFactor})`, 'evt');
  }, [addLog]);

  // --- Pump change ---
  const handlePumpChange = useCallback((v: string) => {
    setPumpKey(v);
    const pump = PUMPS[v];
    addLog(`Bomba seleccionada: ${pump.name} (${pump.flow} L/min, ${pump.power} W)`, 'evt');
  }, [addLog]);

  // --- Soil change ---
  const handleSoilChange = useCallback((v: string) => {
    setSoilKey(v);
    const soil = SOILS[v];
    addLog(`Tipo de tierra: ${soil.name} (evaporación ×${soil.evapMult}, eficiencia ${Math.round(soil.efficiency * 100)}%)`, 'evt');
  }, [addLog]);

  // --- Low threshold change ---
  const handleLowChange = useCallback((v: number) => {
    const clamped = Math.min(v, high - 5);
    setLow(clamped);
  }, [high]);

  // --- High threshold change ---
  const handleHighChange = useCallback((v: number) => {
    const clamped = Math.max(v, low + 5);
    setHigh(clamped);
  }, [low]);

  // --- Login (via API) ---
  const handleLogin = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          return 'Credenciales inválidas. Verifica tu usuario y contraseña.';
        }
        return data.error || 'Error al iniciar sesión';
      }

      setLoggedIn(true);
      addLog(`Sesión iniciada por "${data.user.username}"`, 'evt');
      addLog(`ESP32 listo — esperando inicio del sistema (Serial.begin(115200))`, 'evt');
      addLog(`Configuración inicial: ${PLANTS[plantKey].name} (${PLANTS[plantKey].cat}) sobre tierra ${SOILS[soilKey].name.toLowerCase()}, riego por ${IRRIGATION[irrigKey].name.toLowerCase()}`, 'evt');
      return null; // Success
    } catch {
      return 'Error de conexión al servidor';
    }
  }, [addLog, plantKey, soilKey, irrigKey]);

  // --- Logout ---
  const handleLogout = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setLoggedIn(false);
    setAuthModal((prev) => ({ ...prev, visible: false }));
    addLog('Sesión cerrada', 'evt');

    // Clear token cookie
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors on logout
    }
  }, [addLog]);

  // --- Speed change ---
  const handleSpeedChange = useCallback((v: number) => {
    setSpeed(v);
  }, []);

  // --- Lm2 change ---
  const handleLm2Change = useCallback((v: number) => {
    setLm2(v);
  }, []);

  // --- Loading state ---
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#12181A' }}
      >
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#3FA7D6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#8FA398] font-['JetBrains_Mono'] text-sm">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center"
        style={{
          background: 'radial-gradient(circle at 15% 0%, #1B2420 0%, transparent 45%), #12181A',
        }}
      >
        <LoginScreen onLogin={handleLogin} />
        <AuthModal
          visible={authModal.visible}
          ok={authModal.ok}
          title={authModal.title}
          message={authModal.message}
          onClose={() => setAuthModal({ ...authModal, visible: false })}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#E7EEE9] font-['Inter'] p-7 pb-15"
      style={{
        background: 'radial-gradient(circle at 15% 0%, #1B2420 0%, transparent 45%), #12181A',
      }}
    >
      <div className="max-w-[1180px] mx-auto">
        <Dashboard
          pumpKey={pumpKey}
          irrigKey={irrigKey}
          plantKey={plantKey}
          soilKey={soilKey}
          lm2={lm2}
          low={low}
          high={high}
          speed={speed}
          running={running}
          tank={tank}
          moisture={moisture}
          simMinutes={simMinutes}
          fillValveOn={fillValveOn}
          pumpOn={pumpOn}
          cellOffsets={cellOffsets}
          onPumpChange={handlePumpChange}
          onIrrigChange={handleIrrigChange}
          onPlantChange={handlePlantChange}
          onSoilChange={handleSoilChange}
          onLm2Change={handleLm2Change}
          onLowChange={handleLowChange}
          onHighChange={handleHighChange}
          onSpeedChange={handleSpeedChange}
          onStartStop={handleStartStop}
          onReset={handleReset}
          onLogout={handleLogout}
        />
        <CalculationsPanel
          pumpKey={pumpKey}
          irrigKey={irrigKey}
          soilKey={soilKey}
          lm2={lm2}
          low={low}
          high={high}
        />
        <SerialMonitor logs={logs} />
      </div>
    </div>
  );
}
