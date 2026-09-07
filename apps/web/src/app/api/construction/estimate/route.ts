import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/runtime-public-env';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.text();
  const res = await fetch(`${getApiBaseUrl()}/construction/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
