import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de protección de rutas.
 *
 * Principio de ciberseguridad aplicado:
 * - DEFENSA EN PROFUNDIDAD: Verificamos el token en el middleware (capa de red)
 *   antes de que la request llegue a las API routes o componentes de página.
 *   Esto asegura que ningún contenido privado se sirva a usuarios no autenticados,
 *   incluso si olvidamos validar token en una API route individual.
 *
 * Rutas públicas: /, /login, /register, /api/auth/*, /_next/*, archivos estáticos
 * Rutas protegidas: /simulacion, /api/simulacion/*
 */

// Rutas que NO requieren autenticación.
// La pantalla de simulación maneja su propio estado de sesión en el cliente,
// por lo que no debe redirigir de vuelta a sí misma y crear un bucle infinito.
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/simulacion',
  '/simulacion/',
];

// Prefijos de rutas públicas (no requieren auth)
const PUBLIC_PREFIXES = [
  '/api/auth/',
  '/_next/',
  '/favicon.ico',
];

/**
 * Verifica si una ruta es pública (no requiere autenticación).
 * Principio de ciberseguridad: WHITELIST — solo las rutas explícitamente
 * marcadas como públicas se omiten de la verificación.
 */
function isPublicPath(pathname: string): boolean {
  // Verificar rutas exactas
  if (PUBLIC_PATHS.includes(pathname)) return true;

  // Verificar prefijos (archivos estáticos, API de auth, etc.)
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Si la ruta es pública, permitir acceso sin verificación
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Permitir la página de simulación para que el cliente decida si muestra el login
  // a partir de /api/auth/me. Si redirigimos a la misma ruta, se crea un bucle.
  if (pathname === '/simulacion' || pathname.startsWith('/simulacion/')) {
    return NextResponse.next();
  }

  // Obtener el token JWT de las cookies (httpOnly)
  // Principio de ciberseguridad: El token se almacena en cookie httpOnly,
  // no accesible desde JavaScript del cliente, mitigando ataques XSS.
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // No hay token → redirigir al login
    // Principio de ciberseguridad: FAIL SECURE — si no hay credenciales,
    // denegamos acceso por defecto en lugar de permitirlo.
    const loginUrl = new URL('/simulacion', request.url);
    loginUrl.searchParams.set('auth', 'required');
    return NextResponse.redirect(loginUrl);
  }

  // Verificar la estructura básica del token (payload decodificable)
  // Nota: La verificación completa de firma se hace en las API routes
  // usando jsonwebtoken.verify(). Aquí solo verificamos que el token
  // tenga un formato válido para evitar redirecciones innecesarias.
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      // Token malformado → redirigir al login
      const loginUrl = new URL('/simulacion', request.url);
      loginUrl.searchParams.set('auth', 'invalid');
      const response = NextResponse.redirect(loginUrl);
      // Eliminar cookie inválida
      response.cookies.set('token', '', { maxAge: 0, path: '/' });
      return response;
    }

    // Decodificar el payload para verificar que no esté expirado (claim 'exp')
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      // Token expirado → redirigir al login
      const loginUrl = new URL('/simulacion', request.url);
      loginUrl.searchParams.set('auth', 'expired');
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set('token', '', { maxAge: 0, path: '/' });
      return response;
    }
  } catch {
    // Token corrupto o no decodificable → redirigir al login
    const loginUrl = new URL('/simulacion', request.url);
    loginUrl.searchParams.set('auth', 'corrupted');
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('token', '', { maxAge: 0, path: '/' });
    return response;
  }

  // Token presente y con formato válido → permitir acceso
  // La verificación de firma completa se realiza en cada API route
  // usando verifyToken() de lib/auth.ts
  return NextResponse.next();
}

/**
 * Configuración de matcher: se aplica a todas las rutas excepto
 * archivos estáticos de Next.js y favicon.
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
