import { NextResponse } from 'next/server';
import { proxyConstruction } from '@/lib/construction-proxy';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return proxyConstruction('/construction/intelligence/import', 'POST', body, request);
}

export async function GET() {
  return NextResponse.json({ error: 'Use import-template' }, { status: 405 });
}
