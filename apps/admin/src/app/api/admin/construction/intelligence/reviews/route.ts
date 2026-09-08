import { proxyConstruction } from '@/lib/construction-proxy';

export async function GET() {
  return proxyConstruction('/construction/intelligence/reviews', 'GET');
}
