/**
 * Fail fast in production when critical dependencies are missing.
 * Development allows partial configuration for incremental setup.
 */
import { resolveSearchEngine } from '@varnarc/config';

export function validateStartupEnv(env: NodeJS.ProcessEnv = process.env): void {
  const isProd = env.NODE_ENV === 'production';
  const missing: string[] = [];
  const warnings: string[] = [];

  const requiredAlways = ['DATABASE_URL'];
  const requiredProd = ['AUTH0_DOMAIN', 'AUTH0_AUDIENCE'];

  for (const key of requiredAlways) {
    if (!env[key]?.trim()) missing.push(key);
  }

  if (isProd) {
    for (const key of requiredProd) {
      if (!env[key]?.trim()) missing.push(key);
    }
    if (!env.REDIS_URL?.trim()) {
      warnings.push('REDIS_URL (rate limiting and cache use in-memory fallback)');
    }
    const engine = resolveSearchEngine(env);
    if (engine === 'opensearch' && !env.OPENSEARCH_URL?.trim()) {
      missing.push('OPENSEARCH_URL (production defaults to opensearch; set SEARCH_ENGINE=postgres-fts to override)');
    }
  }

  if (missing.length) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    // eslint-disable-next-line no-console
    console.error(
      `[startup] ${message}. Present keys: DATABASE_URL=${Boolean(env.DATABASE_URL?.trim())}, AUTH0_DOMAIN=${Boolean(env.AUTH0_DOMAIN?.trim())}, AUTH0_AUDIENCE=${Boolean(env.AUTH0_AUDIENCE?.trim())}, SEARCH_ENGINE=${env.SEARCH_ENGINE ?? '(default)'}, REDIS_URL=${Boolean(env.REDIS_URL?.trim())}`,
    );
    if (isProd) {
      throw new Error(message);
    }
    // eslint-disable-next-line no-console
    console.warn(`[startup] ${message}`);
  }

  for (const warning of warnings) {
    // eslint-disable-next-line no-console
    console.warn(`[startup] Recommended in production: ${warning}`);
  }
}
