import { proxyPlatformApi } from '@/lib/platform-api-proxy';

export async function GET(request: Request) {
  return proxyPlatformApi('/keys', 'GET', undefined, request);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return proxyPlatformApi('/keys', 'POST', body);
}
