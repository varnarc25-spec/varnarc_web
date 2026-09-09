import { proxySettings } from '@/lib/settings-proxy';

export async function GET() {
  return proxySettings('/database', 'GET');
}
