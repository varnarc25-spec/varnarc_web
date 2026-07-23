import { NextResponse } from 'next/server';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET(req: Request) {
  const qs = new URL(req.url).searchParams.toString();
  const res = await fetch(`${apiUrl}/search/autocomplete${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
