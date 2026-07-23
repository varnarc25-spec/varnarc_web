import { proxyReviews } from '@/lib/reviews-proxy';

export async function GET() {
  return proxyReviews('/reviews/analytics', 'GET');
}
