import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { getAuth0ClientOptions } from '@varnarc/auth';

export const auth0 = new Auth0Client({
  ...getAuth0ClientOptions(),
  authorizationParameters: {
    scope: 'openid profile email',
    // Database connection only — skip Google/social (Auth0 dev keys fail on custom domains).
    connection: process.env.AUTH0_CONNECTION?.trim() || 'Username-Password-Authentication',
    ...(process.env.AUTH0_AUDIENCE ? { audience: process.env.AUTH0_AUDIENCE } : {}),
  },
});
