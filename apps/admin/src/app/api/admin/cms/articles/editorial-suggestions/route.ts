import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET(request: Request) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const qs = new URLSearchParams({ limit: searchParams.get('limit') || '12' });
  const parentCategorySlug = searchParams.get('parentCategorySlug');
  const categorySlug = searchParams.get('categorySlug');
  const source = searchParams.get('source') || 'all';
  if (parentCategorySlug) qs.set('parentCategorySlug', parentCategorySlug);
  if (categorySlug) qs.set('categorySlug', categorySlug);
  if (source) qs.set('source', source);

  const res = await fetch(`${apiUrl}/articles/editorial-suggestions?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
