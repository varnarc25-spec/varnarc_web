import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET(request: Request, context: { params: Promise<{ documentId: string }> }) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }
  const { documentId } = await context.params;
  const disposition = new URL(request.url).searchParams.get('disposition') || 'attachment';
  const res = await fetch(
    `${apiUrl}/construction/documents/${documentId}/file?disposition=${encodeURIComponent(disposition)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  );
  if (!res.ok) {
    return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  }
  const buf = await res.arrayBuffer();
  const contentType = res.headers.get('Content-Type') || 'application/octet-stream';
  const contentDisposition =
    res.headers.get('Content-Disposition') || `${disposition}; filename="document"`;
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': contentDisposition,
      'Cache-Control': 'private, no-store',
    },
  });
}
