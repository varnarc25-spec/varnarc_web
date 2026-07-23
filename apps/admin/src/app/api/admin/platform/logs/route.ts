import { proxyPlatformApi } from '@/lib/platform-api-proxy';

export async function GET(request: Request) {
  return proxyPlatformApi('/logs', 'GET', undefined, request);
}
