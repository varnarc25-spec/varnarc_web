import { apiServerFetch } from '@/lib/api';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const result = await apiServerFetch('/article-comments/moderation/bulk', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (result.error) {
    return NextResponse.json({ error: { message: result.error } }, { status: 400 });
  }
  return NextResponse.json({ data: result.data });
}
