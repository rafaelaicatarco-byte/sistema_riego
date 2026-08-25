import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';

/**
 * API Route: GET /api/auth/me
 *
 * Principio de ciberseguridad: VERIFICACIÓN SERVER-SIDE DE SESIÓN
 * Esta ruta valida el token JWT en el servidor para confirmar
 * que la sesión del usuario sigue siendo válida. El middleware
 * solo verifica la presencia y formato del token, pero la
 * verificación completa de firma y expiración se hace aquí.
 */

/** Obtiene la IP real del cliente */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

export async function GET(request: Request) {
  const ip = getClientIp(request);

  try {
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookies(cookieHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificación completa del token JWT (firma + expiración)
    // Principio de ciberseguridad: VERIFICACIÓN DE INTEGRIDAD
    // jwt.verify() valida la firma HMAC y la fecha de expiración,
    // asegurando que el token no fue alterado ni expiró.
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        nombre: true,
        createdAt: true,
      },
    });

    if (!user) {
      // Token válido pero usuario no existe (cuenta eliminada)
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    // Principio de ciberseguridad: NO REVELAR DETALLES DEL ERROR
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
