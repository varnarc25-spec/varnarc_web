import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session';
import { getApiBaseUrl } from '@/lib/runtime-public-env';

export { getApiBaseUrl };

export async function getApiAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

export async function apiServerFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T | null; error: string | null; status: number }> {
  const token = await getApiAccessToken();
  const apiUrl = getApiBaseUrl();

  if (!token) {
    return { data: null, error: 'Not authenticated', status: 401 };
  }

  let res: Response;
  try {
    res = await fetch(`${apiUrl}${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
      cache: 'no-store',
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : 'API server unreachable';
    return { data: null, error: message, status: 503 };
  }

  const json = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: { message?: string };
  };

  if (!res.ok) {
    return {
      data: null,
      error: json.error?.message || `Request failed (${res.status})`,
      status: res.status,
    };
  }

  return { data: (json.data as T) ?? null, error: null, status: res.status };
}

export async function fetchPublicCategoryTree<
  T = Array<{
    id: string;
    name: string;
    slug: string;
    children?: Array<{ id: string; name: string; slug: string }>;
  }>,
>(): Promise<T> {
  const apiUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${apiUrl}/categories/tree`, { cache: 'no-store' });
    const json = (await res.json()) as { data?: T };
    return (Array.isArray(json.data) ? json.data : []) as T;
  } catch {
    return [] as T;
  }
}
