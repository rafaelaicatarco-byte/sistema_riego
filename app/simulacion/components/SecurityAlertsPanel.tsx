'use client';

/**
 * Panel de alertas de seguridad para el dashboard.
 *
 * Principio de ciberseguridad: VISIBILIDAD
 * Muestra al administrador las alertas de seguridad detectadas
 * por el sistema de anomalías, permitiendo una respuesta rápida
 * ante posibles incidentes.
 *
 * Los datos se obtienen de /api/security/logs que consulta
 * el sistema de logging y detección de anomalías.
 */

import { useState, useEffect } from 'react';

export interface SecurityAlert {
  timestamp: string;
  usuario: string;
  accion: string;
  resultado: string;
  ip: string;
  detalle: string;
}

export interface SecurityStats {
  total: number;
  loginExitosos: number;
  loginFallidos: number;
  bloqueados: number;
  sospechosos: number;
}

export default function SecurityAlertsPanel() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchSecurityData() {
      try {
        const res = await fetch('/api/security/logs?type=suspicious&limit=20');
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.logs || []);
          setStats(data.stats || null);
        }
      } catch {
        // Silenciar errores de red
      } finally {
        setLoading(false);
      }
    }

    fetchSecurityData();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Color según el tipo de alerta
  function getAlertColor(resultado: string): string {
    if (resultado === 'sospechoso') return 'text-[#E2574C]';
    if (resultado === 'bloqueado') return 'text-[#D98E3B]';
    return 'text-[#8FA398]';
  }

  function getAlertBg(resultado: string): string {
    if (resultado === 'sospechoso') return 'bg-red-500/10 border-red-500/30';
    if (resultado === 'bloqueado') return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-[#212C27] border-[#2C3B33]';
  }

  function formatTime(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return timestamp;
    }
  }

  if (loading) {
    return (
      <div className="bg-[#1B2420] border border-[#2C3B33] rounded-xl p-[18px] mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#8FA398] animate-pulse" />
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#8FA398]">Cargando alertas de seguridad...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1B2420] border border-[#2C3B33] rounded-xl p-[18px] mb-4">
      <div className="flex justify-between items-center mb-3.5">
        <h2 className="font-['Space_Grotesk'] text-[13px] uppercase tracking-[.08em] m-0 text-[#8FA398] flex items-center gap-2 before:content-[''] before:w-[5px] before:h-[5px] before:bg-[#E2574C] before:rotate-45">
          Centro de alertas de seguridad
        </h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-['JetBrains_Mono'] text-[11px] text-[#8FA398] hover:text-[#E7EEE9] transition-colors bg-transparent border-none cursor-pointer"
        >
          {expanded ? '▲ Ocultar' : '▼ Ver más'}
        </button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-[#212C27] border border-[#2C3B33] rounded-lg p-2 text-center">
            <div className="font-['JetBrains_Mono'] text-[18px] font-bold text-[#3FA7D6]">{stats.total}</div>
            <div className="text-[10px] text-[#8FA398] uppercase">Total</div>
          </div>
          <div className="bg-[#212C27] border border-[#2C3B33] rounded-lg p-2 text-center">
            <div className="font-['JetBrains_Mono'] text-[18px] font-bold text-[#59C36A]">{stats.loginExitosos}</div>
            <div className="text-[10px] text-[#8FA398] uppercase">Logins OK</div>
          </div>
          <div className="bg-[#212C27] border border-[#2C3B33] rounded-lg p-2 text-center">
            <div className="font-['JetBrains_Mono'] text-[18px] font-bold text-[#D98E3B]">{stats.loginFallidos}</div>
            <div className="text-[10px] text-[#8FA398] uppercase">Fallidos</div>
          </div>
          <div className="bg-[#212C27] border border-[#2C3B33] rounded-lg p-2 text-center">
            <div className="font-['JetBrains_Mono'] text-[18px] font-bold text-[#E2574C]">{stats.sospechosos}</div>
            <div className="text-[10px] text-[#8FA398] uppercase">Sospechosos</div>
          </div>
        </div>
      )}

      {/* Lista de alertas */}
      {alerts.length === 0 ? (
        <div className="text-center py-4">
          <span className="text-[#5C7A68] text-[12px] font-['JetBrains_Mono']">
            ✓ No hay alertas de seguridad activas
          </span>
        </div>
      ) : (
        <div className={`space-y-2 ${expanded ? '' : 'max-h-[200px] overflow-y-auto'}`}
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#2C3B33 transparent' }}
        >
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`border rounded-lg p-2.5 ${getAlertBg(alert.resultado)}`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-['JetBrains_Mono'] text-[11px] font-bold uppercase ${getAlertColor(alert.resultado)}`}>
                      {alert.resultado === 'sospechoso' ? '⚠ SOSPECHOSO' :
                       alert.resultado === 'bloqueado' ? '🔒 BLOQUEADO' : alert.resultado}
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#5C7A68]">
                      {formatTime(alert.timestamp)}
                    </span>
                  </div>
                  <div className="font-['JetBrains_Mono'] text-[11.5px] text-[#E7EEE9] leading-relaxed">
                    {alert.detalle}
                  </div>
                  <div className="font-['JetBrains_Mono'] text-[10px] text-[#5C7A68] mt-1">
                    Usuario: {alert.usuario} · IP: {alert.ip}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
