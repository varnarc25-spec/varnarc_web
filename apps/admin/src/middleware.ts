import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from './lib/admin-session';

const PUBLIC_PREFIXES = ['/login', '/api/admin/auth'];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isPublicPath(pathname)) {
    const res = NextResponse.next();
    res.headers.set('x-middleware-pathname', pathname);
    return res;
  }

  if (!token) {
    const login = new URL('/login', request.url);
    const path = pathname + request.nextUrl.search;
    if (path && path !== '/') login.searchParams.set('returnTo', path);
    return NextResponse.redirect(login);
  }

  const res = NextResponse.next();
  res.headers.set('x-middleware-pathname', pathname);
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
