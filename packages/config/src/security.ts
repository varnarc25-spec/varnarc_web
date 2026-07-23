/** Default API rate limits (requests per minute). */
export const SECURITY_RATE_LIMITS = {
  global: 120,
  auth: 20,
  search: 60,
  upload: 30,
  newsletter: 10,
  contact: 10,
  ai: 20,
} as const;

/** Secret env keys checked at startup / security overview (values never exposed). */
export const SECRET_ENV_KEYS = [
  'DATABASE_URL',
  'AUTH0_DOMAIN',
  'AUTH0_AUDIENCE',
  'AUTH0_CLIENT_SECRET',
  'AUTH0_MANAGEMENT_CLIENT_ID',
  'AUTH0_MANAGEMENT_CLIENT_SECRET',
  'REDIS_URL',
  'GCS_BUCKET',
  'GCS_PRIVATE_KEY',
  'SMTP_PASSWORD',
  'OPENSEARCH_PASSWORD',
] as const;

export function secretHealthStatus(env: Record<string, string | undefined> = process.env) {
  return SECRET_ENV_KEYS.map((key) => ({
    key,
    configured: Boolean(env[key]?.trim()),
  }));
}
