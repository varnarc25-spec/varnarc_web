import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function proxy(
  path: string,
  init: RequestInit & { token: string },
) {
  const { token, ...rest } = init;
  const res = await fetch(`${apiUrl}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(rest.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}

export async function GET(request: Request) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  return proxy(`/advertisements?${searchParams.toString()}`, { token, method: 'GET' });
}

export async function POST(request: Request) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }
  const body = await request.json();
  return proxy('/advertisements', {
    token,
    method: 'POST',
    body: JSON.stringify(body),
  });
}
