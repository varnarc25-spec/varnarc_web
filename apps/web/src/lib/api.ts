import { auth0 } from '@/lib/auth0';
import { getApiBaseUrl, type ApiEnvelope, ApiError } from '@/services/api-client';

export async function getApiAccessToken(): Promise<string | null> {
  try {
    const audience = process.env.AUTH0_AUDIENCE;
    const result = await auth0.getAccessToken(audience ? { audience } : undefined);
    return result?.token ?? null;
  } catch (error) {
    console.error('[auth] getAccessToken failed', error);
    return null;
  }
}

export async function apiServerFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T | null; error: string | null; status: number; meta?: Record<string, unknown> }> {
  const token = await getApiAccessToken();
  const apiUrl = getApiBaseUrl();

  if (!token) {
    return { data: null, error: 'Not authenticated', status: 401 };
  }

  const res = await fetch(`${apiUrl}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
    cache: 'no-store',
  });

  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T> & {
    meta?: Record<string, unknown>;
    data?: T;
    error?: { message?: string };
  };

  if (!res.ok) {
    return {
      data: null,
      error: (json as { error?: { message?: string } }).error?.message || `Request failed (${res.status})`,
      status: res.status,
    };
  }

  return {
    data: (json as { data?: T }).data ?? null,
    error: null,
    status: res.status,
    meta: (json as { meta?: Record<string, unknown> }).meta,
  };
}

export { ApiError, getApiBaseUrl };
