import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/runtime-public-env';

export async function GET() {
  const res = await fetch(`${getApiBaseUrl()}/ai/features/status`, { cache: 'no-store' });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
