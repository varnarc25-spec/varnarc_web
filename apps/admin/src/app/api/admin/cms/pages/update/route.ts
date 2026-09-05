import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function proxy(path: string, method: string, body?: unknown) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  try {
    const res = await fetch(`${apiUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    const json = text
      ? (() => {
          try {
            return JSON.parse(text) as unknown;
          } catch {
            return {
              error: {
                code: 'INVALID_API_RESPONSE',
                message: text.slice(0, 300) || `API request failed (${res.status})`,
              },
            };
          }
        })()
      : {};
    return NextResponse.json(json, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'API_UNAVAILABLE',
          message: error instanceof Error ? error.message : 'Unable to reach the API.',
        },
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown> & { pageId: string };
  const { pageId, ...rest } = body;
  return proxy(`/pages/${pageId}`, 'PUT', rest);
}
