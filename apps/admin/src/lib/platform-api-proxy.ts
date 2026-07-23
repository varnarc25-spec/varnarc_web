import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function proxyPlatformApi(
  path: string,
  method: string,
  body?: unknown,
  request?: Request,
) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  let url = `${apiUrl}/platform${path.startsWith('/') ? path : `/${path}`}`;
  if (request) {
    const qs = new URL(request.url).searchParams.toString();
    if (qs) url += `${url.includes('?') ? '&' : '?'}${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
