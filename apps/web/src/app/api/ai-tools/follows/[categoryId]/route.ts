import { proxyWebAiTools } from '@/lib/ai-tools-web-proxy';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ categoryId: string }> },
) {
  const { categoryId } = await context.params;
  return proxyWebAiTools(`/ai-tools/me/follows/${categoryId}`, 'DELETE');
}
