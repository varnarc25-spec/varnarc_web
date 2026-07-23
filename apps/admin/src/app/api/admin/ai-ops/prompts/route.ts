import { proxyAiOps } from '@/lib/ai-ops-proxy';

export async function GET(request: Request) {
  return proxyAiOps('/ai/prompts', 'GET', undefined, request);
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyAiOps('/ai/prompts', 'POST', body);
}
