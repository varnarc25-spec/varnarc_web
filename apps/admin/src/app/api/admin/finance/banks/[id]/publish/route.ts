import { proxyFinance } from '@/lib/finance-proxy';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyFinance(`/finance/banks/${id}/publish`, 'POST');
}
