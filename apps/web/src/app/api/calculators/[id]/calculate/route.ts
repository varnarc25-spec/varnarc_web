import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/runtime-public-env';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.text();
  const res = await fetch(`${getApiBaseUrl()}/calculators/${id}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
