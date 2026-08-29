export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[startup] Varnarc admin initializing', {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT ?? '(unset)',
      appBaseUrl: process.env.APP_BASE_URL ?? '(unset)',
      apiUrl: process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '(unset)',
    });
  }
}
