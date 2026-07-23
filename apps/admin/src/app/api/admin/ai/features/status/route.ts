import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET() {
  const res = await fetch(`${apiUrl}/ai/features/status`, { cache: 'no-store' });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
