import { NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/contact';
import { getApiBaseUrl } from '@/services/api-client';

export const runtime = 'nodejs';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip') || 'unknown';
}

function allowRequest(ip: string): boolean {
  const now = Date.now();
  const current = rateBuckets.get(ip);
  if (!current || now > current.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}

export async function POST(request: Request) {
  if (!allowRequest(clientIp(request))) {
    return NextResponse.json(
      {
        ok: false,
        error: 'rate_limited',
        message: 'Too many messages were sent recently. Please wait a few minutes and try again.',
      },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: 'invalid_json',
        message: 'Please try again. If the problem continues, use another available contact route.',
      },
      { status: 400 },
    );
  }

  if (json && typeof json === 'object' && JSON.stringify(json).length > 20_000) {
    return NextResponse.json(
      {
        ok: false,
        error: 'payload_too_large',
        message: 'Please try again. If the problem continues, use another available contact route.',
      },
      { status: 413 },
    );
  }

  const parsed = contactFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'validation',
        message: 'Please check the highlighted fields and try again.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  try {
    const apiUrl = getApiBaseUrl();
    const res = await fetch(`${apiUrl}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': clientIp(request),
        'user-agent': request.headers.get('user-agent') || '',
      },
      body: JSON.stringify({
        topic: payload.topic,
        name: payload.name,
        email: payload.email,
        subject: payload.subject,
        message: payload.message,
        company: payload.company ?? null,
        orgWebsite: payload.orgWebsite ?? null,
        pageUrl: payload.pageUrl ?? null,
        correctionIssue: payload.correctionIssue ?? null,
        supportIssue: payload.supportIssue ?? null,
        supportFeature: payload.supportFeature ?? null,
        faxNumber: payload.faxNumber || null,
        formStartedAt: payload.formStartedAt ?? null,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      data?: { ok?: boolean; stored?: boolean; emailed?: boolean };
      error?: { code?: string; message?: string };
    };

    if (!res.ok || data.success === false) {
      return NextResponse.json(
        {
          ok: false,
          error: data.error?.code || 'send_failed',
          message:
            data.error?.message ||
            'Please try again. If the problem continues, use another available contact route.',
          stored: data.data?.stored ?? true,
        },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      stored: data.data?.stored ?? true,
      emailed: data.data?.emailed ?? false,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: 'send_failed',
        message: 'Please try again. If the problem continues, use another available contact route.',
      },
      { status: 502 },
    );
  }
}
