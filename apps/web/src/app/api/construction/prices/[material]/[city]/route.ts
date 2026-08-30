import { NextResponse } from 'next/server';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET(
  _request: Request,
  context: { params: Promise<{ material: string; city: string }> },
) {
  const { material, city } = await context.params;
  const res = await fetch(`${apiUrl}/construction/prices/${material}/${city}`, {
    method: 'GET',
    cache: 'no-store',
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
