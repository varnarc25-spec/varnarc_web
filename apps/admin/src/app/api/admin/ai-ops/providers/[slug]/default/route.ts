import { proxyAiOps } from '@/lib/ai-ops-proxy';

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  return proxyAiOps(`/ai/providers/${encodeURIComponent(slug)}/default`, 'POST');
}
