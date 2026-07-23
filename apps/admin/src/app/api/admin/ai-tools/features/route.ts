import { proxyAiTools } from '@/lib/ai-tools-proxy';

export async function GET() {
  return proxyAiTools('/ai-tools/admin/features', 'GET');
}

export async function DELETE(request: Request) {
  const name = new URL(request.url).searchParams.get('name') || '';
  return proxyAiTools(`/ai-tools/admin/features?name=${encodeURIComponent(name)}`, 'DELETE');
}
