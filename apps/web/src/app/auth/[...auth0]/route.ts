import { NextResponse, type NextRequest } from 'next/server';
import { isAuth0Configured, isAuthUiEnabled } from '@varnarc/auth';
import { auth0 } from '@/lib/auth0';

/**
 * Fallback when Edge middleware cannot run Auth0 (e.g. Cloud Run listen host 0.0.0.0).
 * Auth0 v4 normally handles /auth/login in middleware; this route prevents a 404.
 */
async function handle(request: NextRequest) {
  const envReady =
    isAuth0Configured() || (isAuthUiEnabled() && Boolean(process.env.AUTH0_DOMAIN?.trim()));
  if (!envReady) {
    const home = new URL('/', request.url);
    home.searchParams.set('login_error', 'Sign-in is temporarily unavailable.');
    return NextResponse.redirect(home);
  }

  return auth0.middleware(request);
}

export const GET = handle;
export const POST = handle;
