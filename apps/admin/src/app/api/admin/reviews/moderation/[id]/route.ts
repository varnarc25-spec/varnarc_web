import { proxyReviews } from '@/lib/reviews-proxy';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  return proxyReviews(`/reviews/moderation/${id}`, 'PUT', body);
}
