import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST(request: Request) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const body = (await request.json()) as { articleId?: string; versionId?: string };
  const { articleId, versionId } = body;
  if (!articleId || !versionId) {
    return NextResponse.json(
      { error: { message: 'articleId and versionId are required' } },
      { status: 400 },
    );
  }

  const res = await fetch(`${apiUrl}/articles/${articleId}/versions/${versionId}/restore`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
