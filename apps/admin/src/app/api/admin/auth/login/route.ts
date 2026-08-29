import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions } from '@/lib/admin-session';
import { getApiBaseUrl } from '@/lib/runtime-public-env';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const apiUrl = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${apiUrl}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ error: { message: 'API server unreachable' } }, { status: 503 });
  }
  const json = (await res.json().catch(() => ({}))) as {
    data?: { token?: string };
    error?: { message?: string };
  };

  if (!res.ok || !json.data?.token) {
    return NextResponse.json(json, { status: res.status || 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, json.data.token, adminSessionCookieOptions());
  return response;
}
