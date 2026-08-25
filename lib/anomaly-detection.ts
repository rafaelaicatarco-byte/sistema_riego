/**
 * Módulo de detección básica de eventos sospechosos.
 *
 * Principios de ciberseguridad aplicados:
 * - DETECCIÓN DE INTRUSOS (IDS básico): Monitoreamos patrones
 *   anómalos en los logs de seguridad para identificar posibles
 *   ataques en curso.
 * - ANÁLISIS DE COMPORTAMIENTO: Comparamos la actividad actual
 *   contra umbrales predefinidos para detectar desviaciones.
 *
 * Tipos de anomalías detectadas:
 * 1. Fuerza bruta: >3 intentos fallidos de login en 5 minutos
 * 2. Activaciones de motor anómalas: >5 activaciones en 1 minuto
 * 3. Cambios de configuración repetidos: >3 cambios en 2 minutos
 */

import { logSecurityEvent, type SecurityLogEntry } from './logger';

// --- Configuración de umbrales ---

/** Máximo de intentos de login fallidos antes de marcar como sospechoso */
const MAX_FAILED_LOGINS = 3;
/** Ventana de tiempo para detectar fuerza bruta (ms) */
const BRUTE_FORCE_WINDOW_MS = 5 * 60 * 1000; // 5 minutos

/** Máximo de activaciones de motor en un período */
const MAX_PUMP_ACTIVATIONS = 5;
/** Ventana de tiempo para detectar activaciones anómalas (ms) */
const PUMP_WINDOW_MS = 60 * 1000; // 1 minuto

/** Máximo de cambios de configuración en un período */
const MAX_CONFIG_CHANGES = 3;
/** Ventana de tiempo para detectar cambios repetidos (ms) */
const CONFIG_WINDOW_MS = 2 * 60 * 1000; // 2 minutos

// --- Almacén temporal para análisis ---

/**
 * Historial de eventos recientes para análisis de anomalías.
 * Se mantiene en memoria para rendimiento.
 */
interface EventRecord {
  timestamp: number;
  usuario: string;
  ip: string;
  accion: string;
}

const eventHistory: EventRecord[] = [];

// Mantener solo los últimos 1000 eventos
const MAX_HISTORY = 1000;

/**
 * Agrega un evento al historial para análisis.
 */
function addToHistory(entry: SecurityLogEntry): void {
  eventHistory.push({
    timestamp: new Date(entry.timestamp).getTime(),
    usuario: entry.usuario,
    ip: entry.ip,
    accion: entry.accion,
  });

  // Limitar tamaño del historial
  if (eventHistory.length > MAX_HISTORY) {
    eventHistory.splice(0, eventHistory.length - MAX_HISTORY);
  }
}

/**
 * Cuenta eventos que coinciden con un filtro dentro de una ventana de tiempo.
 */
function countEventsInWindow(
  filter: (e: EventRecord) => boolean,
  windowMs: number,
): number {
  const now = Date.now();
  return eventHistory.filter(
    (e) => filter(e) && now - e.timestamp <= windowMs,
  ).length;
}

// --- Funciones de detección ---

/**
 * Detecta intentos de fuerza bruta de login.
 * Marca como sospechoso si hay más de N intentos fallidos
 * en la ventana de tiempo configurada, desde el mismo usuario o IP.
 *
 * @param entry - El evento de login fallido recién registrado
 */
export async function detectBruteForce(entry: SecurityLogEntry): Promise<void> {
  if (entry.accion !== 'login_fallido') return;

  addToHistory(entry);

  // Contar intentos fallidos del mismo usuario
  const userAttempts = countEventsInWindow(
    (e) => e.accion === 'login_fallido' && e.usuario === entry.usuario,
    BRUTE_FORCE_WINDOW_MS,
  );

  // Contar intentos fallidos de la misma IP
  const ipAttempts = countEventsInWindow(
    (e) => e.accion === 'login_fallido' && e.ip === entry.ip,
    BRUTE_FORCE_WINDOW_MS,
  );

  if (userAttempts >= MAX_FAILED_LOGINS) {
    await logSecurityEvent({
      usuario: entry.usuario,
      accion: 'evento_sospechoso',
      resultado: 'sospechoso',
      ip: entry.ip,
      detalle: `FUERZA BRUTA DETECTADA: ${userAttempts} intentos fallidos de login del usuario "${entry.usuario}" en los últimos ${BRUTE_FORCE_WINDOW_MS / 60000} minutos`,
    });
  }

  if (ipAttempts >= MAX_FAILED_LOGINS * 2) {
    await logSecurityEvent({
      usuario: entry.usuario,
      accion: 'evento_sospechoso',
      resultado: 'sospechoso',
      ip: entry.ip,
      detalle: `FUERZA BRUTA DETECTADA (por IP): ${ipAttempts} intentos fallidos desde IP ${entry.ip} en los últimos ${BRUTE_FORCE_WINDOW_MS / 60000} minutos`,
    });
  }
}

/**
 * Detecta activaciones anómalas del motor/bomba.
 * Marca como sospechoso si hay más de N activaciones
 * en un minuto, lo cual es inusual para un sistema de riego.
 *
 * @param entry - El evento de activación del motor
 */
export async function detectAnomalousPumpActivity(entry: SecurityLogEntry): Promise<void> {
  if (entry.accion !== 'activar_motor') return;

  addToHistory(entry);

  const activations = countEventsInWindow(
    (e) => e.accion === 'activar_motor' && e.usuario === entry.usuario,
    PUMP_WINDOW_MS,
  );

  if (activations >= MAX_PUMP_ACTIVATIONS) {
    await logSecurityEvent({
      usuario: entry.usuario,
      accion: 'evento_sospechoso',
      resultado: 'sospechoso',
      ip: entry.ip,
      detalle: `ACTIVACIÓN ANÓMALA DEL MOTOR: ${activations} activaciones en ${PUMP_WINDOW_MS / 1000} segundos por usuario "${entry.usuario}". Frecuencia inusual para un sistema de riego.`,
    });
  }
}

/**
 * Detecta cambios repetidos de configuración del tanque.
 * Marca como sospechoso si hay más de N cambios en 2 minutos,
 * lo cual podría indicar manipulación del sistema.
 *
 * @param entry - El evento de cambio de configuración
 */
export async function detectAnomalousConfigChanges(entry: SecurityLogEntry): Promise<void> {
  if (entry.accion !== 'cambio_config_tanque' && entry.accion !== 'cambio_parametros_riego') return;

  addToHistory(entry);

  const changes = countEventsInWindow(
    (e) =>
      (e.accion === 'cambio_config_tanque' || e.accion === 'cambio_parametros_riego') &&
      e.usuario === entry.usuario,
    CONFIG_WINDOW_MS,
  );

  if (changes >= MAX_CONFIG_CHANGES) {
    await logSecurityEvent({
      usuario: entry.usuario,
      accion: 'evento_sospechoso',
      resultado: 'sospechoso',
      ip: entry.ip,
      detalle: `CAMBIOS REPETIDOS DE CONFIGURACIÓN: ${changes} cambios en ${CONFIG_WINDOW_MS / 1000} segundos por usuario "${entry.usuario}". Posible manipulación del sistema.`,
    });
  }
}

/**
 * Función principal de análisis de anomalías.
 * Se llama después de registrar cada evento de seguridad
 * para evaluar si el patrón es sospechoso.
 *
 * @param entry - El evento de seguridad recién registrado
 */
export async function analyzeEvent(entry: SecurityLogEntry): Promise<void> {
  // No analizar eventos que ya son sospechosos (evitar loops)
  if (entry.resultado === 'sospechoso' || entry.accion === 'evento_sospechoso') {
    addToHistory(entry);
    return;
  }

  // Ejecutar todas las detecciones
  await detectBruteForce(entry);
  await detectAnomalousPumpActivity(entry);
  await detectAnomalousConfigChanges(entry);
}
