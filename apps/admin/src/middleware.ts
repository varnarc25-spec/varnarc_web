import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAppBaseUrl, isAuth0Configured } from '@varnarc/auth';
import { auth0 } from './lib/auth0';

const PUBLIC = ['/auth'];

function isPublicPath(pathname: string) {
  return PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function logoutRedirect() {
  const base = getAppBaseUrl();
  const logout = new URL(`${base}/auth/logout`);
  logout.searchParams.set('returnTo', `${base}/auth/login`);
  return NextResponse.redirect(logout);
}

function authNotConfiguredResponse() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Admin — auth not configured</title></head>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem">
  <h1>Auth0 is not configured</h1>
  <p>The <code>varnarc-admin</code> Cloud Run service is missing Auth0 secrets or env vars.</p>
  <p>Run:</p>
  <pre style="background:#f4f4f5;padding:1rem;overflow:auto">export GCP_PROJECT_ID=myweb-503314
export APP_BASE_URL=https://varnarc-admin-414895350436.asia-south1.run.app
export API_URL=https://varnarc-api-414895350436.asia-south1.run.app/api/v1
export AUTH0_CLIENT_ID=&lt;your-admin-auth0-client-id&gt;
./scripts/gcp/configure-cloud-run-frontend.sh admin</pre>
  <p>Then add your admin callback URL to Auth0 Allowed Callback URLs
  (e.g. <code>https://varnarc-admin-….run.app/auth/callback</code>).</p>
</body>
</html>`;
  return new NextResponse(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAuth0Configured()) {
    return authNotConfiguredResponse();
  }

  if (pathname === '/auth/callback' && request.nextUrl.searchParams.has('error')) {
    const description =
      request.nextUrl.searchParams.get('error_description') ??
      request.nextUrl.searchParams.get('error') ??
      'Login failed';
    const login = new URL('/auth/login', request.url);
    login.searchParams.set('login_error', description);
    return NextResponse.redirect(login);
  }

  try {
    const authResponse = await auth0.middleware(request);

    if (isPublicPath(pathname)) {
      authResponse.headers.set('x-middleware-pathname', pathname);
      return authResponse;
    }

    const session = await auth0.getSession(request);
    if (!session?.user) {
      const base = getAppBaseUrl();
      const login = new URL(`${base}/auth/login`);
      const path = request.nextUrl.pathname + request.nextUrl.search;
      login.searchParams.set('returnTo', `${base}${path}`);
      return NextResponse.redirect(login);
    }

    try {
      const audience = process.env.AUTH0_AUDIENCE;
      await auth0.getAccessToken(request, authResponse as NextResponse, {
        ...(audience ? { audience } : {}),
      });
    } catch {
      return logoutRedirect();
    }

    authResponse.headers.set('x-middleware-pathname', pathname);
    return authResponse;
  } catch (err) {
    console.error('[middleware] Fatal auth error:', err);
    return authNotConfiguredResponse();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
