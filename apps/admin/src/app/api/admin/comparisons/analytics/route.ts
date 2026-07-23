import { proxyComparisons } from '@/lib/comparison-proxy';

export async function GET() {
  return proxyComparisons('/comparisons/analytics', 'GET');
}
