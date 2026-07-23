import { proxyAiOps } from '@/lib/ai-ops-proxy';

export async function POST(request: Request) {
  const body = await request.json();
  return proxyAiOps('/ai/run-test', 'POST', body);
}
