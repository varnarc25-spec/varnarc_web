import { proxyWebAiTools } from '@/lib/ai-tools-web-proxy';

export async function GET() {
  return proxyWebAiTools('/ai-tools/me/follows', 'GET');
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyWebAiTools('/ai-tools/me/follows', 'POST', body);
}
