import { NextResponse } from 'next/server';
import { apiServerFetch } from '@/lib/api';

export async function POST(request: Request) {
  const body = await request.json();
  const result = await apiServerFetch('/premium/admin/plans', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status || 400 });
  }

  return NextResponse.json({ data: result.data });
}
