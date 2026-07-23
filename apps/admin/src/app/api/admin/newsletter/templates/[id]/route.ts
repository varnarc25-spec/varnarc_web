import { proxyNewsletter } from '@/lib/newsletter-proxy';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyNewsletter(`/templates/${id}`, 'GET');
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  return proxyNewsletter(`/templates/${id}`, 'PUT', body);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyNewsletter(`/templates/${id}`, 'DELETE');
}
