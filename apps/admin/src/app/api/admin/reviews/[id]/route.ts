import { proxyReviews } from '@/lib/reviews-proxy';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyReviews(`/reviews/admin/${id}`, 'GET');
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  return proxyReviews(`/reviews/${id}`, 'PUT', body);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyReviews(`/reviews/${id}`, 'DELETE');
}
