import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { getAuth0ClientOptions } from '@varnarc/auth';

export const auth0 = new Auth0Client({
  ...getAuth0ClientOptions(),
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: 'openid profile email',
  },
});
