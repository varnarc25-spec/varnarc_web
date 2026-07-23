import { proxyHomepage } from '@/lib/homepage-proxy';

export async function GET() {
  return proxyHomepage('/widgets', 'GET');
}
