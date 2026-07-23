import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const token = await getApiAccessToken();
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json();
  const res = await fetch(`${apiUrl}/calculators/${id}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
