import { proxyComparisons } from '@/lib/comparison-proxy';

export async function GET(request: Request) {
  return proxyComparisons('/comparisons/templates', 'GET', undefined, request);
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyComparisons('/comparisons/templates', 'POST', body);
}
