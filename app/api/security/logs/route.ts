import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { getRecentLogs, getSuspiciousLogs, getLogStats } from '@/lib/logger';

/**
 * API Route: GET /api/security/logs
 *
 * Principio de ciberseguridad: CONTROL DE ACCESO
 * Solo usuarios autenticados pueden ver los logs de seguridad.
 * Verificamos el token JWT antes de retornar cualquier dato.
 *
 * Parámetros query:
 * - limit: Número máximo de logs (default: 100)
 * - type: "all" | "suspicious" (default: "all")
 * - stats: "true" para obtener solo estadísticas
 */

export async function GET(request: Request) {
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

    // Parsear parámetros de query
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const type = url.searchParams.get('type') || 'all';
    const statsOnly = url.searchParams.get('stats') === 'true';

    // Si solo se piden estadísticas
    if (statsOnly) {
      return NextResponse.json({ stats: getLogStats() });
    }

    // Obtener logs según el tipo solicitado
    let logs;
    if (type === 'suspicious') {
      logs = getSuspiciousLogs(limit);
    } else {
      logs = getRecentLogs(limit);
    }

    return NextResponse.json({
      logs,
      stats: getLogStats(),
      count: logs.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
