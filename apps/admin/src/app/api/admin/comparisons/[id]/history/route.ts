import { proxyComparisons } from '@/lib/comparison-proxy';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyComparisons(`/comparisons/admin/${id}/history`, 'GET');
}
