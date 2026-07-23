import { proxyNewsletter } from '@/lib/newsletter-proxy';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  return proxyNewsletter(`/campaigns/${id}/send`, 'POST', body);
}
