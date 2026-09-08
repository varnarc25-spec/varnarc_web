import { proxyConstruction } from '@/lib/construction-proxy';

export async function GET() {
  return proxyConstruction('/construction/intelligence/quotations', 'GET');
}
