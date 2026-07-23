import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { getAppBaseUrl } from '@varnarc/auth';

export const auth0 = new Auth0Client({
  appBaseUrl: getAppBaseUrl(),
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: 'openid profile email',
  },
});
