import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/runtime-public-env';

export async function POST(req: Request) {
  const body = await req.text();
  const res = await fetch(`${getApiBaseUrl()}/analytics/vitals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  return new NextResponse(null, { status: res.status });
}
