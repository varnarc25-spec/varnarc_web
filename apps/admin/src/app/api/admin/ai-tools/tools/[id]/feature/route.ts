import { proxyAiTools } from '@/lib/ai-tools-proxy';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyAiTools(`/ai-tools/${id}/feature`, 'POST');
}
