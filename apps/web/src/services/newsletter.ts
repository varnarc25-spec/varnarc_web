import { ApiError, type ApiFailure, type ApiSuccess } from '@/services/api-client';

export type NewsletterSubscribeResult = {
  id: string;
  email: string;
  status: string;
  subscribedAt: string;
  alreadySubscribed?: boolean;
  source?: string | null;
};

async function newsletterFetch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api/newsletter/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8_000),
  });
  const payload = (await response.json().catch(() => ({}))) as ApiSuccess<T> | ApiFailure;
  if (!response.ok || payload.success === false) {
    const failure = payload as ApiFailure;
    throw new ApiError(
      failure.error?.message || `Request failed (${response.status})`,
      response.status,
      failure.error?.code,
    );
  }
  return (payload as ApiSuccess<T>).data;
}

export async function subscribeToNewsletter(input: { email: string; source?: string }) {
  return newsletterFetch<NewsletterSubscribeResult>('subscribe', input);
}

export async function unsubscribeFromNewsletter(email: string) {
  return newsletterFetch<{
    email: string;
    status: string;
    found: boolean;
    unsubscribedAt?: string | null;
  }>('unsubscribe', { email });
}
