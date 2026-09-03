import { proxyAiOps } from '@/lib/ai-ops-proxy';

export async function GET() {
  return proxyAiOps('/ai/providers', 'GET');
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyAiOps('/ai/providers', 'POST', body);
}
