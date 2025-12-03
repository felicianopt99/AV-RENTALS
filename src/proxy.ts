import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/equipment',
  '/clients',
  '/events',
  '/quotes',
  '/rentals',
  '/inventory',
  '/maintenance',
  '/categories',
  '/admin',
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth routes: allow access even if token exists to avoid redirect loops
  // If token is invalid, clear it.
  if (isAuthRoute) {
    if (token) {
      try {
        jwt.verify(token, process.env.JWT_SECRET!);
        // Valid token: allow /login to render so user can switch accounts or re-auth
        return NextResponse.next();
      } catch (error) {
        const response = NextResponse.next();
        response.cookies.delete('auth-token');
        return response;
      }
    }
    return NextResponse.next();
  }

  // Admin-only routes: require Admin role
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      // Normalize role to lowercase for comparison to avoid case mismatches
      const role = String(decoded.role || '').toLowerCase();
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    } catch (error) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }

  // Redirect root to login if not authenticated, dashboard if authenticated
  if (pathname === '/') {
    const isMobile = /mobile/i.test(request.headers.get('user-agent') || '');
    if (token) {
      try {
        jwt.verify(token, process.env.JWT_SECRET!);
        const targetUrl = isMobile ? '/home' : '/dashboard';
        return NextResponse.redirect(new URL(targetUrl, request.url));
      } catch (error) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token');
        return response;
      }
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};