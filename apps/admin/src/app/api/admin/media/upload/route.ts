import { NextResponse } from 'next/server';
import { getApiAccessToken, getApiBaseUrl } from '@/lib/api';

export const runtime = 'nodejs';
export const maxDuration = 60;

function fetchErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return 'Upload proxy failed';
  const cause = (err as Error & { cause?: { message?: string; code?: string } }).cause;
  const detail = cause?.message || cause?.code;
  if (err.message === 'fetch failed' && detail) {
    return `Could not reach the media API (${detail}).`;
  }
  return err.message;
}

async function readJsonSafe(res: Response): Promise<{
  payload: Record<string, unknown>;
  parseError?: string;
}> {
  const text = await res.text();
  if (!text.trim()) {
    return {
      payload: {},
      parseError: `Upload failed (${res.status}) with an empty response.`,
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

  const apiUrl = getApiBaseUrl();

  try {
    const incoming = await request.formData();
    const file = incoming.get('file');
    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ error: { message: 'No file uploaded.' } }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const name = file instanceof File && file.name ? file.name : 'upload.bin';
    const type = file.type || 'application/octet-stream';
    const rebuilt = new File([bytes], name, { type });

    const outgoing = new FormData();
    outgoing.append('file', rebuilt, name);
    const folderId = incoming.get('folderId');
    if (typeof folderId === 'string' && folderId) outgoing.append('folderId', folderId);
    const alt = incoming.get('alt');
    if (typeof alt === 'string' && alt) outgoing.append('alt', alt);

    const res = await fetch(`${apiUrl}/media/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: outgoing,
      cache: 'no-store',
    });

    const { payload, parseError } = await readJsonSafe(res);
    if (parseError && !payload.error) {
      return NextResponse.json(
        { error: { message: parseError } },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }
    return NextResponse.json(payload, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: { message: fetchErrorMessage(err) } }, { status: 502 });
  }
}
