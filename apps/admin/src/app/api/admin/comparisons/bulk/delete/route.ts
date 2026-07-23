import { proxyComparisons } from '@/lib/comparison-proxy';

export async function POST(request: Request) {
  const body = await request.json();
  return proxyComparisons('/comparisons/bulk/delete', 'POST', body);
}
