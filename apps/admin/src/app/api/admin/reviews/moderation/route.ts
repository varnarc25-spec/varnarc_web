import { proxyReviews } from '@/lib/reviews-proxy';

export async function GET(request: Request) {
  return proxyReviews('/reviews/moderation', 'GET', undefined, request);
}
