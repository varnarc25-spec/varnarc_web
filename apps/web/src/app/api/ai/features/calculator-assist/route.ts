import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/runtime-public-env';

export async function POST(request: Request) {
  const body = await request.text();
  const res = await fetch(`${getApiBaseUrl()}/ai/features/calculator-assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
