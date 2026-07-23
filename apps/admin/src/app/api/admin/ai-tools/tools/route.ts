import { proxyAiTools } from '@/lib/ai-tools-proxy';

export async function GET(request: Request) {
  return proxyAiTools('/ai-tools/admin', 'GET', undefined, request);
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyAiTools('/ai-tools', 'POST', body);
}
