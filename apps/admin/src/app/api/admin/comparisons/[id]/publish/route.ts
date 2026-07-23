import { proxyComparisons } from '@/lib/comparison-proxy';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyComparisons(`/comparisons/${id}/publish`, 'POST');
}
