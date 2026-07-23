import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET() {
  const token = await getApiAccessToken();
  if (!token)
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  const res = await fetch(`${apiUrl}/users/me/preferences`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function PUT(req: Request) {
  const token = await getApiAccessToken();
  if (!token)
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  const body = await req.json();
  const res = await fetch(`${apiUrl}/users/me/preferences`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
