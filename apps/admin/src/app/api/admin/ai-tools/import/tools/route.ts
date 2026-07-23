import { proxyAiToolsImport } from '@/lib/ai-tools-proxy';

export async function POST(request: Request) {
  const formData = await request.formData();
  return proxyAiToolsImport(formData);
}
