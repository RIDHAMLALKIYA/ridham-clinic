import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession, updateSession } from './lib/auth';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  // Protect doctor, admin, and lobby (queue) routes
  if (pathname.startsWith('/doctor') || pathname.startsWith('/admin') || pathname.startsWith('/queue')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Auto-renew session on every protected page visit
    const renewedResponse = await updateSession(request);
    if (renewedResponse) return renewedResponse;
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
  matcher: ['/doctor/:path*', '/admin/:path*', '/queue/:path*', '/login'],
};
