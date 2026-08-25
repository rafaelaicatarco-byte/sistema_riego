/**
 * Módulo de validación de entrada para autenticación.
 *
 * Principios de ciberseguridad aplicados:
 * - VALIDACIÓN DE ENTRADA: Nunca confiamos en datos del cliente.
 *   Cada campo se valida contra reglas estrictas antes de procesarlo.
 * - DEFENSA EN PROFUNDIDAD: Validamos tanto en frontend como backend.
 *   El backend es la fuente de verdad; el frontend solo mejora la UX.
 */

// --- Validación de email ---

/**
 * Expresión regular para validar formato de email.
 * Cumple con RFC 5322 simplificada, suficiente para uso práctico.
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Valida que el email tenga un formato correcto.
 * @returns string con mensaje de error, o null si es válido.
 */
export function validateEmail(email: string): string | null {
  if (!email || email.trim().length === 0) {
    return 'El correo electrónico es obligatorio';
  }
  if (email.length > 254) {
    return 'El correo electrónico es demasiado largo (máximo 254 caracteres)';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'El formato del correo electrónico no es válido';
  }
  return null;
}

// --- Validación de contraseña ---

/**
 * Valida la fortaleza mínima de una contraseña.
 * Reglas:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos una letra minúscula
 * - Al menos un número
 *
 * Principio de ciberseguridad: CONTRASEÑAS FUERTES
 * Un atacante no puede adivinar contraseñas con fuerza bruta
 * si tienen complejidad mínima.
 *
 * @returns string con mensaje de error, o null si es válida.
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'La contraseña es obligatoria';
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  if (password.length > 128) {
    return 'La contraseña es demasiado larga (máximo 128 caracteres)';
  }
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe contener al menos una letra mayúscula';
  }
  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe contener al menos una letra minúscula';
  }
  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe contener al menos un número';
  }
  return null;
}

// --- Validación de username ---

/**
 * Valida el formato del nombre de usuario.
 * @returns string con mensaje de error, o null si es válido.
 */
export function validateUsername(username: string): string | null {
  if (!username || username.trim().length === 0) {
    return 'El nombre de usuario es obligatorio';
  }
  if (username.length < 3) {
    return 'El nombre de usuario debe tener al menos 3 caracteres';
  }
  if (username.length > 30) {
    return 'El nombre de usuario es demasiado largo (máximo 30 caracteres)';
  }
  // Solo letras, números, guiones y guiones bajos
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos';
  }
  return null;
}

// --- Rate Limiting (limitación de intentos) ---

/**
 * Almacén en memoria para rate limiting de login.
 * En producción se usaría Redis o similar.
 *
 * Principio de ciberseguridad: MITIGACIÓN DE FUERZA BRUTA
 * Limitamos el número de intentos de login por IP/usuario
 * en una ventana de tiempo para dificultar ataques de fuerza bruta.
 */

interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

// Mapa: clave = "ip" o "ip:username" → datos de rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuración de rate limiting
const MAX_ATTEMPTS = 5;           // Máximo de intentos fallidos
const WINDOW_MS = 15 * 60 * 1000; // Ventana de 15 minutos
const BLOCK_DURATION_MS = 15 * 60 * 1000; // Bloqueo de 15 minutos

/**
 * Limpia entradas expiradas del store (evita memory leak).
 */
function cleanupStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    // Eliminar si la ventana expiró y no está bloqueado
    if (now - entry.firstAttemptAt > WINDOW_MS && (!entry.blockedUntil || entry.blockedUntil < now)) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Verifica si una IP/usuario está bloqueado por intentos fallidos.
 * @param ip Dirección IP del cliente
 * @param username Nombre de usuario (opcional)
 * @returns { blocked: boolean, retryAfter?: number } 
 */
export function checkRateLimit(
  ip: string,
  username?: string,
): { blocked: boolean; retryAfter?: number } {
  cleanupStore();

  const key = username ? `${ip}:${username.toLowerCase()}` : ip;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return { blocked: false };
  }

  // Verificar si está actualmente bloqueado
  if (entry.blockedUntil && entry.blockedUntil > Date.now()) {
    const retryAfter = Math.ceil((entry.blockedUntil - Date.now()) / 1000);
    return { blocked: true, retryAfter };
  }

  return { blocked: false };
}

/**
 * Registra un intento fallido de login.
 * @param ip Dirección IP del cliente
 * @param username Nombre de usuario intentado
 */
export function recordFailedAttempt(ip: string, username: string): void {
  const key = `${ip}:${username.toLowerCase()}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.firstAttemptAt > WINDOW_MS) {
    // Nueva ventana
    rateLimitStore.set(key, {
      attempts: 1,
      firstAttemptAt: now,
      blockedUntil: null,
    });
    return;
  }

  entry.attempts++;

  if (entry.attempts >= MAX_ATTEMPTS) {
    // Bloquear al usuario/IP
    entry.blockedUntil = now + BLOCK_DURATION_MS;
  }
}

/**
 * Registra un login exitoso — resetea el contador.
 * @param ip Dirección IP del cliente
 * @param username Nombre de usuario
 */
export function recordSuccessfulLogin(ip: string, username: string): void {
  const key = `${ip}:${username.toLowerCase()}`;
  rateLimitStore.delete(key);
}
