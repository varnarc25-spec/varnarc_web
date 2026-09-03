import { proxyAiOps } from '@/lib/ai-ops-proxy';

type RouteContext = { params: Promise<{ slug: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const body = await request.json();
  return proxyAiOps(`/ai/providers/${encodeURIComponent(slug)}`, 'PUT', body);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  return proxyAiOps(`/ai/providers/${encodeURIComponent(slug)}`, 'DELETE');
}
