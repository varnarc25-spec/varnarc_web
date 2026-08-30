import { NextResponse } from 'next/server';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET() {
  const res = await fetch(`${apiUrl}/construction/prices/landings`, {
    method: 'GET',
    next: { revalidate: 300 },
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
