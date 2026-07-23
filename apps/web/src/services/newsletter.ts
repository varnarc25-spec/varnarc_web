import { apiPublicFetch } from '@/services/api-client';

export type NewsletterSubscribeResult = {
  id: string;
  email: string;
  status: string;
  subscribedAt: string;
  alreadySubscribed?: boolean;
  source?: string | null;
};

export async function subscribeToNewsletter(input: {
  email: string;
  source?: string;
}) {
  const { data } = await apiPublicFetch<NewsletterSubscribeResult>('/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  return data;
}

export async function unsubscribeFromNewsletter(email: string) {
  const { data } = await apiPublicFetch<{
    email: string;
    status: string;
    found: boolean;
    unsubscribedAt?: string | null;
  }>('/newsletter/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
    cache: 'no-store',
  });
  return data;
}
