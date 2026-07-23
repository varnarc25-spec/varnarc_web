import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET(request: Request) {
  const qs = new URL(request.url).searchParams.toString();
  const res = await fetch(`${apiUrl}/article-comments${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(request: Request) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Sign in to comment.' } }, { status: 401 });
  }

  const body = await request.text();
  const res = await fetch(`${apiUrl}/article-comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body,
    cache: 'no-store',
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
