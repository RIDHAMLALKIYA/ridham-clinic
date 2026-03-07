import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/auth';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  // Protect doctor and admin routes
  if (pathname.startsWith('/doctor') || pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect logged-in users away from login page
  if (pathname === '/login' && session) {
    if (session.user.role === 'doctor') {
      return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/doctor/:path*', '/admin/:path*', '/login'],
};
