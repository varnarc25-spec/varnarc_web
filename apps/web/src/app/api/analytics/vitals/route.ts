import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/runtime-public-env';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const res = await fetch(`${getApiBaseUrl()}/analytics/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (!res.ok) {
      return new NextResponse(null, { status: 204 });
    }
    return new NextResponse(null, { status: res.status });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
