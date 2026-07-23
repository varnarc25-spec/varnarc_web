import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const res = await fetch(`${apiUrl}/premium/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = (await res.json()) as { data?: unknown; error?: { message?: string } };
  if (!res.ok) {
    return NextResponse.json({ error: json.error?.message ?? 'Cancel failed' }, { status: res.status });
  }

  return NextResponse.json({ data: json.data });
}
