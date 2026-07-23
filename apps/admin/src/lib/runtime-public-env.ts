/** API base URL for server components (prefers Cloud Run runtime API_URL). */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  return (fromEnv ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');
}
