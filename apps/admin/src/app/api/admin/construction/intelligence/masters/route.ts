import { proxyConstruction } from '@/lib/construction-proxy';

export async function GET(request: Request) {
  return proxyConstruction('/construction/intelligence/masters', 'GET', undefined, request);
}
