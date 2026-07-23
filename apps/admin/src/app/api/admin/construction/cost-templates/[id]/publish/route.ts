import { proxyConstruction } from '@/lib/construction-proxy';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyConstruction(`/construction/cost-templates/${id}/publish`, 'POST');
}
