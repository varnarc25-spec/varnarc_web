import { NextResponse } from 'next/server';
import { apiServerFetch } from '@/lib/api';

export async function POST() {
  const result = await apiServerFetch('/analytics/adsense/sync', { method: 'POST' });

  if (result.error) {
    return NextResponse.json({ error: { message: result.error } }, { status: result.status || 400 });
  }

  return NextResponse.json({ data: result.data });
}
