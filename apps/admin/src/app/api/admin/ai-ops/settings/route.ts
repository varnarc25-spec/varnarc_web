import { proxyAiOps } from '@/lib/ai-ops-proxy';

export async function GET() {
  return proxyAiOps('/ai/settings', 'GET');
}
