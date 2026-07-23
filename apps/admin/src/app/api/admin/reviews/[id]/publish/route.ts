import { proxyReviews } from '@/lib/reviews-proxy';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyReviews(`/reviews/${id}/publish`, 'POST');
}
