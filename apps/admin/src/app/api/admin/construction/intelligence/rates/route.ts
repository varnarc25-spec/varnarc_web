import { proxyConstruction } from '@/lib/construction-proxy';

export async function GET(request: Request) {
  return proxyConstruction('/construction/intelligence/rates', 'GET', undefined, request);
}
