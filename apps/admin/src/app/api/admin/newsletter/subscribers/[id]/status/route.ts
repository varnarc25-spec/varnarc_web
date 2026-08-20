import { proxyNewsletter } from '@/lib/newsletter-proxy';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  return proxyNewsletter(`/subscribers/${id}/status`, 'PUT', body);
}
