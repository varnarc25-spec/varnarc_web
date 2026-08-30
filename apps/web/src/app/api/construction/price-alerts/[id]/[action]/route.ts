import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; action: string }> },
) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }
  const { id, action } = await context.params;
  if (action !== 'pause' && action !== 'resume') {
    return NextResponse.json({ error: { message: 'Unknown action' } }, { status: 400 });
  }
  const res = await fetch(`${apiUrl}/construction/price-alerts/${id}/${action}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
