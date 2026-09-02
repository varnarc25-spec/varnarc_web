import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function readJsonSafe(res: Response): Promise<{
  payload: Record<string, unknown>;
  parseError?: string;
}> {
  const text = await res.text();
  if (!text.trim()) {
    return {
      payload: {},
      parseError: `Upload failed (${res.status}) with an empty response. Try a smaller file or paste a URL.`,
    };
  }
  try {
    return { payload: JSON.parse(text) as Record<string, unknown> };
  } catch {
    return {
      payload: {},
      parseError: text.slice(0, 180) || `Upload failed (${res.status}).`,
    };
  }
}

export async function POST(request: Request) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: { message: 'Expected a multipart file upload.' } },
        { status: 400 },
      );
    }

    const res = await fetch(`${apiUrl}/media/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
      },
      body: request.body,
      duplex: 'half',
    } as RequestInit);

    const { payload, parseError } = await readJsonSafe(res);
    if (parseError && !payload.error) {
      return NextResponse.json(
        { error: { message: parseError } },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }
    return NextResponse.json(payload, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload proxy failed';
    return NextResponse.json({ error: { message } }, { status: 502 });
  }
}
