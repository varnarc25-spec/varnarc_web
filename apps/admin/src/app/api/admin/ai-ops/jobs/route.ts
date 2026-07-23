import { proxyAiOps } from '@/lib/ai-ops-proxy';

export async function GET(request: Request) {
  return proxyAiOps('/ai/jobs', 'GET', undefined, request);
}
