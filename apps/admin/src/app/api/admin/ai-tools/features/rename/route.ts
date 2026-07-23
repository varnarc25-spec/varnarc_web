import { proxyAiTools } from '@/lib/ai-tools-proxy';

export async function POST(request: Request) {
  const body = await request.json();
  return proxyAiTools('/ai-tools/admin/features/rename', 'POST', body);
}
