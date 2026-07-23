import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth0 } from './lib/auth0';
import { getMaintenanceStatus } from './lib/maintenance';
import { resolveSeoRedirect } from './lib/seo-redirects';

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    // Auth0 redirects here with ?error= when login fails (e.g. wrong audience).
    // Handle before auth0.middleware — otherwise the SDK throws and returns 500.
    if (pathname === '/auth/callback' && request.nextUrl.searchParams.has('error')) {
      const description =
        request.nextUrl.searchParams.get('error_description') ??
        request.nextUrl.searchParams.get('error') ??
        'Login failed';
      const home = new URL('/', request.url);
      home.searchParams.set('login_error', description);
      return NextResponse.redirect(home);
    }

    if (!pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
      const redirect = await resolveSeoRedirect(pathname);
      if (redirect) {
        const destination = redirect.targetPath.startsWith('http')
          ? redirect.targetPath
          : new URL(redirect.targetPath, request.url).toString();
        return NextResponse.redirect(destination, redirect.redirectType === 302 ? 302 : 301);
      }
    }

    if (
      !pathname.startsWith('/_next') &&
      !pathname.startsWith('/api') &&
      pathname !== '/maintenance'
    ) {
      const maintenance = await getMaintenanceStatus();
      if (maintenance.active) {
        const url = request.nextUrl.clone();
        url.pathname = '/maintenance';
        if (maintenance.message) {
          url.searchParams.set('message', maintenance.message);
        }
        return NextResponse.redirect(url, 503);
      }
    }

    const authResponse = await auth0.middleware(request);

    try {
      const session = await auth0.getSession(request);
      if (session) {
        const audience = process.env.AUTH0_AUDIENCE;
        await auth0.getAccessToken(request, authResponse as NextResponse, {
          ...(audience ? { audience } : {}),
        });
      }
    } catch {
      // User may be logged out, or API audience not yet granted for this session.
    }

    return authResponse;
  } catch (err) {
    console.error('[middleware] Fatal auth error:', err);
    throw err;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
