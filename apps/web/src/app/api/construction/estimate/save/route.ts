import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/runtime-public-env';

export async function POST(request: Request) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const body = await request.json();
  const res = await fetch(`${getApiBaseUrl()}/construction/estimate/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
