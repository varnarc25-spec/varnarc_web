export type SearchEngineId = 'postgres-fts' | 'opensearch';

/**
 * Resolve the active search engine.
 * - Explicit `SEARCH_ENGINE` wins when set to a known value.
 * - Production defaults to OpenSearch (set `SEARCH_ENGINE=postgres-fts` to override).
 * - Local/dev defaults to Postgres FTS.
 */
export function resolveSearchEngine(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): SearchEngineId {
  const explicit = env.SEARCH_ENGINE?.trim();
  if (explicit === 'opensearch' || explicit === 'postgres-fts') {
    return explicit;
  }

  const nodeEnv = env.NODE_ENV ?? 'development';
  if (nodeEnv === 'production') {
    return 'opensearch';
  }

  return 'postgres-fts';
}

export function isOpenSearchEngine(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
) {
  return resolveSearchEngine(env) === 'opensearch';
}

export function getOpenSearchEnv(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
) {
  const url = env.OPENSEARCH_URL?.trim();
  if (!url) return null;

  return {
    url: url.replace(/\/$/, ''),
    index: env.OPENSEARCH_INDEX?.trim() || 'varnarc-search',
    username: env.OPENSEARCH_USERNAME?.trim(),
    password: env.OPENSEARCH_PASSWORD?.trim(),
    requestTimeoutMs: Number(env.OPENSEARCH_TIMEOUT_MS ?? 3000),
    dualWrite: env.SEARCH_ENGINE_DUAL_WRITE?.trim() !== 'false',
  };
}
