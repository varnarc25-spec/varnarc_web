import { NextResponse } from 'next/server';
import { getApiAccessToken, getApiBaseUrl } from '@/lib/api';

export async function proxyAdminApi(path: string, init: RequestInit = {}): Promise<NextResponse> {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  try {
    const apiUrl = getApiBaseUrl();
    const res = await fetch(`${apiUrl}${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : 'API server unreachable';
    return NextResponse.json({ success: false, error: { message } }, { status: 503 });
  }
}
