import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = await getApiAccessToken();
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });

  const { id } = await context.params;
  const res = await fetch(`${apiUrl}/users/me/reading-history/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
