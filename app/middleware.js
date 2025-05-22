import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const PROTECTED_ROUTES = {
  '/gerencia': 'gerencia',
  '/lider': 'lider',
  '/analista': 'analista',
  '/auxiliar': 'auxiliar',
  '/practicante': 'practicante',
};

export function middleware(request) {
  const { pathname } = request.nextUrl;

  for (const route in PROTECTED_ROUTES) {
    if (pathname.startsWith(route)) {
      const token = request.cookies.get('token')?.value;
      if (!token) return NextResponse.redirect(new URL('/login', request.url));

      try {
        console.log('JWT_SECRET en middleware:', process.env.JWT_SECRET);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const role = PROTECTED_ROUTES[route];

        if (decoded.role !== role) {
          return NextResponse.redirect(new URL('/login', request.url));
        }

        return NextResponse.next();
      } catch {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/gerencia/:path*',
    '/lider/:path*',
    '/analista/:path*',
    '/auxiliar/:path*',
    '/practicante/:path*',
  ],
};
