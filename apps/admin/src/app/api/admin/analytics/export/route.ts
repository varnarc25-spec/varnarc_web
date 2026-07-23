import { proxyAnalytics } from '@/lib/analytics-proxy';

export async function GET(req: Request) {
  const token = await import('@/lib/api').then((m) => m.getApiAccessToken());
  if (!token) {
    return new Response(JSON.stringify({ error: { message: 'Not authenticated' } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
  const qs = new URL(req.url).searchParams.toString();
  const url = `${apiUrl}/analytics/export${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as {
    data?: { filename?: string; contentType?: string; content?: string };
    error?: { message?: string };
  };

  if (!res.ok || !json.data?.content) {
    return new Response(JSON.stringify(json), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { filename, contentType, content } = json.data;
  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename || 'analytics-export'}"`,
    },
  });
}
