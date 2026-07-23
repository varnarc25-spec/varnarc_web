declare global {
  interface Window {
    __VARNARC_PUBLIC_ENV__?: {
      apiUrl?: string;
      appUrl?: string;
    };
  }
}

/** Inline script for layout — exposes Cloud Run runtime env to the browser. */
export function getRuntimePublicEnvScript(): string | null {
  const apiUrl = process.env.API_URL?.trim();
  const appUrl = process.env.APP_BASE_URL?.trim();
  if (!apiUrl && !appUrl) return null;
  const payload = JSON.stringify({ apiUrl, appUrl });
  return `window.__VARNARC_PUBLIC_ENV__=${payload};`;
}

/** API base URL for server and client (prefers runtime API_URL on Cloud Run). */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.__VARNARC_PUBLIC_ENV__?.apiUrl) {
    return window.__VARNARC_PUBLIC_ENV__.apiUrl.replace(/\/$/, '');
  }
  const fromEnv = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  return (fromEnv ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');
}
