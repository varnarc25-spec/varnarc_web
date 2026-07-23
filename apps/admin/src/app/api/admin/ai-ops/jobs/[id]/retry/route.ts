import { proxyAiOps } from '@/lib/ai-ops-proxy';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAiOps(`/ai/jobs/${id}/retry`, 'POST', {});
}
