import { NextResponse } from 'next/server';
import { getApiAccessToken, getApiBaseUrl } from '@/lib/api';

export const maxDuration = 300;

export async function GET() {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const apiUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${apiUrl}/settings/database/backup`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      return NextResponse.json(
        { success: false, error: { message: json.error?.message || 'Backup failed' } },
        { status: res.status },
      );
    }

    const filename =
      res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ??
      'varnarc-backup.sql';

    return new NextResponse(res.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : 'API server unreachable';
    return NextResponse.json({ success: false, error: { message } }, { status: 503 });
  }
}
