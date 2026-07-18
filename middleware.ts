import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo proteger rutas API que no sean de auth
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    // Las rutas API protegidas se validan individualmente
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
