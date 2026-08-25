import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import {
  checkRateLimit,
  recordFailedAttempt,
  recordSuccessfulLogin,
} from '@/lib/validation';
import { logSecurityEvent } from '@/lib/logger';

/**
 * API Route: POST /api/auth/login
 *
 * Principios de ciberseguridad aplicados:
 * - RATE LIMITING: Limita intentos fallidos de login por IP/usuario
 * - VALIDACIÓN DE ENTRADA: Verifica formato y presencia de campos
 * - MENSAJES GENÉRICOS: No revelamos si el usuario existe o no
 * - LOGGING DE SEGURIDAD: Registra cada intento para auditoría
 * - HASH DE CONTRASEÑA: bcrypt con salt rounds = 10
 */

/** Obtiene la IP real del cliente, considerando proxies */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    const { username, password } = await request.json();

    // Validación de entrada básica
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // Rate limiting: verificar si la IP/usuario está bloqueado
    const rateCheck = checkRateLimit(ip, username);
    if (rateCheck.blocked) {
      // Log del intento bloqueado
      await logSecurityEvent({
        usuario: username,
        accion: 'login_fallido',
        resultado: 'bloqueado',
        ip,
        detalle: `Intento bloqueado por rate limiting. Reintentar en ${rateCheck.retryAfter}s`,
      });

      return NextResponse.json(
        {
          error: `Demasiados intentos fallidos. Intenta de nuevo en ${rateCheck.retryAfter} segundos.`,
          retryAfter: rateCheck.retryAfter,
        },
        { status: 429 }
      );
    }

    // Buscar usuario por username o email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: username.toLowerCase() },
        ],
      },
    });

    if (!user) {
      // Principio de ciberseguridad: NO REVELAR SI EL USUARIO EXISTE
      // Usamos el mismo mensaje para "usuario no existe" y "contraseña incorrecta"
      // para evitarEnumeración de usuarios.
      recordFailedAttempt(ip, username);

      await logSecurityEvent({
        usuario: username,
        accion: 'login_fallido',
        resultado: 'error',
        ip,
        detalle: 'Usuario no encontrado',
      });

      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar contraseña con bcrypt
    // Principio de ciberseguridad: CONTRASEÑAS HASHEADAS
    // bcrypt con salt rounds = 10 hace que un ataque de rainbow table
    // sea impracticable, y el salt único previene ataques de precomputación.
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      recordFailedAttempt(ip, username);

      await logSecurityEvent({
        usuario: user.username,
        accion: 'login_fallido',
        resultado: 'error',
        ip,
        detalle: `Contraseña incorrecta para usuario "${user.username}"`,
      });

      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Login exitoso — resetear rate limit
    recordSuccessfulLogin(ip, user.username);

    // Generar token JWT con expiración de 7 días
    // Principio de ciberseguridad: TOKENS CON EXPIRACIÓN
    // El token expira después de 7 días, limitando la ventana de
    // explotación si es comprometido.
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    // Log del login exitoso
    await logSecurityEvent({
      usuario: user.username,
      accion: 'login_exitoso',
      resultado: 'ok',
      ip,
      detalle: `Login exitoso desde IP ${ip}`,
    });

    const response = NextResponse.json({
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nombre: user.nombre,
      },
    });

    // Set cookie httpOnly
    // Principio de ciberseguridad:
    // - httpOnly: No accesible desde JavaScript del cliente (mitiga XSS)
    // - secure: Solo se envía por HTTPS en producción
    // - sameSite: Previene ataques CSRF
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });

    return response;
  } catch (error) {
    // Log del error del servidor (sin detalles sensibles)
    await logSecurityEvent({
      usuario: 'unknown',
      accion: 'login_fallido',
      resultado: 'error',
      ip,
      detalle: `Error interno: ${error instanceof Error ? error.message : 'desconocido'}`,
    });

    // Principio de ciberseguridad: NO REVELAR DETALLES DEL ERROR
    // Mensajes genéricos evitan filtrar información sobre la infraestructura
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
