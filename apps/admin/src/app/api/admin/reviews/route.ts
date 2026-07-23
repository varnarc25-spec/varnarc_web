import { proxyReviews } from '@/lib/reviews-proxy';

export async function GET(request: Request) {
  return proxyReviews('/reviews/admin', 'GET', undefined, request);
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyReviews('/reviews', 'POST', body);
}
