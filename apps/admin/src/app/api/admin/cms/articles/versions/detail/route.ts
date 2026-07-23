import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET(request: Request) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('articleId');
  const versionId = searchParams.get('versionId');
  if (!articleId || !versionId) {
    return NextResponse.json(
      { error: { message: 'articleId and versionId are required' } },
      { status: 400 },
    );
  }

  const res = await fetch(`${apiUrl}/articles/${articleId}/versions/${versionId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
