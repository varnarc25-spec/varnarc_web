import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST(request: Request) {
  const token = await getApiAccessToken();
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: { message: 'No file uploaded' } }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append('file', file);

  const res = await fetch(`${apiUrl}/users/me/avatar/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: upstream,
    cache: 'no-store',
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
