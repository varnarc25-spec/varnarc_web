import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/** Private invoice download — never cache; owner/admin only on API. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }
  const { id } = await context.params;
  const res = await fetch(`${apiUrl}/construction/community-prices/${id}/invoice`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  }
  const buf = await res.arrayBuffer();
  const headers = new Headers();
  headers.set('Content-Type', res.headers.get('Content-Type') || 'application/octet-stream');
  headers.set(
    'Content-Disposition',
    res.headers.get('Content-Disposition') || 'attachment; filename="invoice"',
  );
  headers.set('Cache-Control', 'private, no-store');
  return new NextResponse(buf, { status: 200, headers });
}
