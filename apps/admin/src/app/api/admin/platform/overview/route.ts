import { proxyPlatformApi } from '@/lib/platform-api-proxy';

export async function GET() {
  return proxyPlatformApi('/overview', 'GET');
}
