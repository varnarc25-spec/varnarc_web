export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[startup] Varnarc web initializing', {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT ?? '(unset)',
      appBaseUrl: process.env.APP_BASE_URL ?? '(unset)',
      hasAuth0Domain: Boolean(process.env.AUTH0_DOMAIN),
      hasAuth0ClientId: Boolean(process.env.AUTH0_CLIENT_ID),
      hasAuth0Secret: Boolean(process.env.AUTH0_SECRET),
      hasAuth0ClientSecret: Boolean(process.env.AUTH0_CLIENT_SECRET),
    });
  }
}
