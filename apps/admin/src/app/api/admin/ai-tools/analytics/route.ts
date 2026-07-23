import { proxyAiTools } from '@/lib/ai-tools-proxy';

export async function GET() {
  return proxyAiTools('/ai-tools/analytics', 'GET');
}
