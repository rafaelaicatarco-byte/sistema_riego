/**
 * Módulo de logging y trazabilidad de eventos de seguridad.
 *
 * Principios de ciberseguridad aplicados:
 * - TRAZABILIDAD: Cada evento de seguridad se registra con timestamp,
 *   usuario, acción, resultado, IP y detalle. Esto permite
 *   reconstruir la secuencia de eventos en caso de incidente.
 * - AUDITORÍA: Los logs mantienen un registro forense que puede
 *   usarse para detectar patrones de ataque y cumplir con
 *   políticas de seguridad.
 *
 * Almacenamiento: Archivo JSON en /data/security-logs.json
 * (En producción se usaría un sistema de logs centralizado como ELK)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { analyzeEvent } from './anomaly-detection';

// --- Definición de tipos ---

/**
 * Acciones de seguridad que se pueden registrar.
 * Cada acción representa un evento significativo de seguridad.
 */
export type SecurityAction =
  | 'login_exitoso'
  | 'login_fallido'
  | 'logout'
  | 'registro_exitoso'
  | 'registro_fallido'
  | 'activar_motor'
  | 'desactivar_motor'
  | 'cambio_config_tanque'
  | 'lectura_sensor'
  | 'cambio_parametros_riego'
  | 'evento_sospechoso'
  | 'acceso_no_autorizado'
  | 'token_invalido';

/**
 * Resultado del evento de seguridad.
 */
export type SecurityResult = 'ok' | 'error' | 'bloqueado' | 'sospechoso';

/**
 * Estructura de un evento de seguridad registrado.
 * Cumple con el formato especificado en los requerimientos.
 */
export interface SecurityLogEntry {
  timestamp: string;
  usuario: string;
  accion: SecurityAction;
  resultado: SecurityResult;
  ip: string;
  detalle: string;
}

/**
 * Parámetros para registrar un evento de seguridad.
 */
export interface LogEventParams {
  usuario: string;
  accion: SecurityAction;
  resultado: SecurityResult;
  ip: string;
  detalle: string;
}

// --- Configuración ---

const DATA_DIR = join(process.cwd(), 'data');
const LOG_FILE = join(DATA_DIR, 'security-logs.json');

// En memoria mantenemos los últimos N logs para consultas rápidas del frontend
const MAX_IN_MEMORY = 500;
const inMemoryLogs: SecurityLogEntry[] = [];

// --- Funciones internas ---

/**
 * Asegura que el directorio de datos existe.
 */
function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Carga logs previos del archivo al iniciar.
 * Evita pérdida de datos al reiniciar el servidor.
 */
function loadExistingLogs(): void {
  try {
    if (existsSync(LOG_FILE)) {
      const raw = readFileSync(LOG_FILE, 'utf-8');
      const parsed: SecurityLogEntry[] = JSON.parse(raw);
      // Cargar solo los últimos MAX_IN_MEMORY
      inMemoryLogs.push(...parsed.slice(-MAX_IN_MEMORY));
    }
  } catch {
    // Si el archivo está corrupto, empezamos desde cero
    console.error('[Logger] Error al cargar logs previos, iniciando desde cero');
  }
}

/**
 * Persiste los logs en memoria al archivo JSON.
 * En producción se usaría un writer async o un sistema centralizado.
 */
function persistLogs(): void {
  try {
    ensureDataDir();
    writeFileSync(LOG_FILE, JSON.stringify(inMemoryLogs, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Logger] Error al persistir logs:', error);
  }
}

// Cargar logs existentes al importar el módulo
loadExistingLogs();

// --- API pública ---

/**
 * Registra un evento de seguridad.
 *
 * Esta función se llama desde las API routes y el middleware
 * para mantener un registro forense de todas las acciones
 * de seguridad relevantes.
 *
 * @param params - Parámetros del evento a registrar
 *
 * Ejemplo de uso:
 * ```ts
 * await logSecurityEvent({
 *   usuario: 'admin',
 *   accion: 'login_exitoso',
 *   resultado: 'ok',
 *   ip: '192.168.1.1',
 *   detalle: 'Login exitoso desde Chrome/Windows',
 * });
 * ```
 */
export async function logSecurityEvent(params: LogEventParams): Promise<void> {
  const entry: SecurityLogEntry = {
    timestamp: new Date().toISOString(),
    usuario: params.usuario,
    accion: params.accion,
    resultado: params.resultado,
    ip: params.ip,
    detalle: params.detalle,
  };

  // Agregar a memoria
  inMemoryLogs.push(entry);

  // Mantener solo los últimos N en memoria
  if (inMemoryLogs.length > MAX_IN_MEMORY) {
    inMemoryLogs.splice(0, inMemoryLogs.length - MAX_IN_MEMORY);
  }

  // Persistir al archivo
  persistLogs();

  // Analizar si el evento es sospechoso (detección de anomalías)
  // Se ejecuta de forma async para no bloquear el logging principal
  analyzeEvent(entry).catch((err) => {
    console.error('[Logger] Error en análisis de anomalías:', err);
  });

  // También loguear a console para debugging en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    const color = params.resultado === 'ok' ? '\x1b[32m' :
                  params.resultado === 'bloqueado' ? '\x1b[31m' :
                  params.resultado === 'sospechoso' ? '\x1b[33m' :
                  '\x1b[36m';
    console.log(
      `${color}[SECURITY]\x1b[0m ${entry.timestamp} | ` +
      `User: ${entry.usuario} | Action: ${entry.accion} | ` +
      `Result: ${entry.resultado} | IP: ${entry.ip} | ${entry.detalle}`
    );
  }
}

/**
 * Obtiene los últimos N logs de seguridad.
 * Usado por el panel de alertas del dashboard.
 *
 * @param limit - Número máximo de logs a retornar (default: 100)
 * @returns Array de logs ordenados del más reciente al más antiguo
 */
export function getRecentLogs(limit: number = 100): SecurityLogEntry[] {
  return inMemoryLogs.slice(-limit).reverse();
}

/**
 * Obtiene los logs filtrados por tipo de acción.
 *
 * @param action - Tipo de acción a filtrar
 * @param limit - Número máximo de logs a retornar
 * @returns Array de logs filtrados
 */
export function getLogsByAction(
  action: SecurityAction,
  limit: number = 50,
): SecurityLogEntry[] {
  return inMemoryLogs
    .filter((log) => log.accion === action)
    .slice(-limit)
    .reverse();
}

/**
 * Obtiene logs marcados como sospechosos.
 *
 * @param limit - Número máximo de logs a retornar
 * @returns Array de logs sospechosos
 */
export function getSuspiciousLogs(limit: number = 50): SecurityLogEntry[] {
  return inMemoryLogs
    .filter((log) => log.resultado === 'sospechoso')
    .slice(-limit)
    .reverse();
}

/**
 * Obtiene estadísticas básicas de los logs.
 */
export function getLogStats(): {
  total: number;
  loginExitosos: number;
  loginFallidos: number;
  bloqueados: number;
  sospechosos: number;
} {
  return {
    total: inMemoryLogs.length,
    loginExitosos: inMemoryLogs.filter((l) => l.accion === 'login_exitoso').length,
    loginFallidos: inMemoryLogs.filter((l) => l.accion === 'login_fallido').length,
    bloqueados: inMemoryLogs.filter((l) => l.resultado === 'bloqueado').length,
    sospechosos: inMemoryLogs.filter((l) => l.resultado === 'sospechoso').length,
  };
}
