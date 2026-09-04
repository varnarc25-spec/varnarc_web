import { NextResponse } from 'next/server';

const apiUrl =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const response = await fetch(`${apiUrl}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    const payload = await response.json().catch(() => ({
      success: false,
      error: {
        code: 'INVALID_RESPONSE',
        message: 'Newsletter service returned an invalid response.',
      },
    }));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NEWSLETTER_UNAVAILABLE',
          message: 'Could not subscribe. Please try again.',
        },
      },
      { status: 502 },
    );
  }
}
