import { NextResponse } from 'next/server';
import { proxyAdminApi } from '@/lib/admin-api-proxy';

export async function GET() {
  const res = await proxyAdminApi('/articles/ai/status');
  if (res.status >= 500) {
    return NextResponse.json(
      {
        success: true,
        data: { configured: false, imageGeneration: false },
      },
      { status: 200 },
    );
  }
  return res;
}
