import { proxyReviews } from '@/lib/reviews-proxy';

export async function GET(request: Request) {
  return proxyReviews('/reviews/products', 'GET', undefined, request);
}
