import { proxyAiTools } from '@/lib/ai-tools-proxy';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();
  return proxyAiTools(`/ai-tools/${id}`, 'PUT', body);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyAiTools(`/ai-tools/${id}`, 'DELETE');
}
