import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logSecurityEvent } from '@/lib/logger';

/**
 * API Route: POST /api/simulation/actions
 *
 * Principio de ciberseguridad: LOGGING DE ACCIONES CRÍTICAS
 * Cada acción importante de la simulación (activar motor,
 * cambiar configuración, etc.) se registra en el sistema
 * de logs de seguridad para auditoría y detección de anomalías.
 *
 * Body esperado:
 * {
 *   accion: "activar_motor" | "desactivar_motor" | "cambio_config_tanque" | "cambio_parametros_riego" | "lectura_sensor",
 *   detalle: string
 * }
 */

/** Obtiene la IP real del cliente */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

// Acciones permitidas para logging
const ALLOWED_ACTIONS = [
  'activar_motor',
  'desactivar_motor',
  'cambio_config_tanque',
  'cambio_parametros_riego',
  'lectura_sensor',
] as const;

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    // Verificar autenticación
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookies(cookieHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    const { accion, detalle } = await request.json();

    // Validar que la acción esté en la lista de permitidas
    if (!accion || !ALLOWED_ACTIONS.includes(accion)) {
      return NextResponse.json(
        { error: 'Acción no válida' },
        { status: 400 }
      );
    }

    // Registrar el evento de seguridad
    await logSecurityEvent({
      usuario: payload.username,
      accion,
      resultado: 'ok',
      ip,
      detalle: detalle || `Acción ${accion} ejecutada por ${payload.username}`,
    });

    return NextResponse.json({ message: 'Evento registrado', accion });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
