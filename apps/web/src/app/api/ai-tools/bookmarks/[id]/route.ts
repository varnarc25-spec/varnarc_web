import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type Props = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Props) {
  const { id } = await params;
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Sign in to manage bookmarks.' } }, { status: 401 });
  }

  const res = await fetch(`${apiUrl}/ai-tools/bookmarks/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
