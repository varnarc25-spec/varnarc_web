import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET(request: Request) {
  const token = await getApiAccessToken();
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });

  const qs = new URL(request.url).searchParams.toString();
  const res = await fetch(`${apiUrl}/users/me/bookmarks${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(request: Request) {
  const token = await getApiAccessToken();
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });

  const body = await request.json();
  const res = await fetch(`${apiUrl}/users/me/bookmarks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
