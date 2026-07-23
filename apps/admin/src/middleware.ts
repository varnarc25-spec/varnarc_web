import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth0 } from './lib/auth0';

const PUBLIC = ['/auth'];

function isPublicPath(pathname: string) {
  return PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function logoutRedirect(request: NextRequest) {
  const logout = new URL('/auth/logout', request.nextUrl.origin);
  logout.searchParams.set('returnTo', `${request.nextUrl.origin}/auth/login`);
  return NextResponse.redirect(logout);
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const authResponse = await auth0.middleware(request);

    if (isPublicPath(pathname)) {
      authResponse.headers.set('x-middleware-pathname', pathname);
      return authResponse;
    }

    const session = await auth0.getSession(request);
    if (!session?.user) {
      const login = new URL('/auth/login', request.nextUrl.origin);
      login.searchParams.set('returnTo', request.nextUrl.toString());
      return NextResponse.redirect(login);
    }

    try {
      const audience = process.env.AUTH0_AUDIENCE;
      await auth0.getAccessToken(request, authResponse as NextResponse, {
        ...(audience ? { audience } : {}),
      });
    } catch {
      return logoutRedirect(request);
    }

    authResponse.headers.set('x-middleware-pathname', pathname);
    return authResponse;
  } catch (err) {
    console.error('[middleware] Fatal auth error:', err);
    throw err;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
