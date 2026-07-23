import { proxyAiTools } from '@/lib/ai-tools-proxy';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyAiTools(`/ai-tools/admin/${id}/history`, 'GET');
}
