import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { validateEmail, validatePassword, validateUsername } from '@/lib/validation';
import { logSecurityEvent } from '@/lib/logger';

/**
 * API Route: POST /api/auth/register
 *
 * Principios de ciberseguridad aplicados:
 * - VALIDACIÓN DE ENTRADA: Email, contraseña y username se validan contra reglas estrictas
 * - HASH DE CONTRASEÑA: bcrypt con salt rounds = 10 antes de almacenar
 * - UNICIDAD: Verificamos que username y email no estén en uso
 * - LOGGING: Registramos cada registro para auditoría
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
    const { username, email, password, nombre } = await request.json();

    // --- Validación de username ---
    const usernameError = validateUsername(username);
    if (usernameError) {
      return NextResponse.json({ error: usernameError }, { status: 400 });
    }

    // --- Validación de email ---
    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    // --- Validación de contraseña (fortaleza mínima) ---
    // Principio de ciberseguridad: CONTRASEÑAS FUERTES
    // Requerimos complejidad mínima para dificultar ataques de fuerza bruta.
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // Verificar si el usuario ya existe (username o email)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      // Principio de ciberseguridad: NO REVELAR QUÉ CAMPO EXISTE
      // Mensaje genérico para evitarEnumeración de usuarios/emails.
      return NextResponse.json(
        { error: 'Ya existe una cuenta con esos datos' },
        { status: 409 }
      );
    }

    // Crear usuario con contraseña hasheada
    // Principio de ciberseguridad: HASH DE CONTRASEÑA
    // bcrypt genera un hash único con salt, haciendo inútil cualquier
    // tabla rainbow o ataque de precomputación.
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        nombre: nombre || null,
      },
    });

    // Log del registro exitoso
    await logSecurityEvent({
      usuario: user.username,
      accion: 'registro_exitoso',
      resultado: 'ok',
      ip,
      detalle: `Nuevo usuario registrado: ${user.username}`,
    });

    // Generar token para auto-login después del registro
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const response = NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nombre: user.nombre,
        },
      },
      { status: 201 }
    );

    // Set cookie httpOnly (mismos principios de seguridad que login)
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });

    return response;
  } catch (error) {
    await logSecurityEvent({
      usuario: 'unknown',
      accion: 'registro_fallido',
      resultado: 'error',
      ip,
      detalle: `Error en registro: ${error instanceof Error ? error.message : 'desconocido'}`,
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
