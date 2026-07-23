import { proxyConstruction } from '@/lib/construction-proxy';

export async function GET(_request: Request, context: { params: Promise<{ entity: string; id: string }> }) {
  const { entity, id } = await context.params;
  return proxyConstruction(`/construction/admin/history/${entity}/${id}`, 'GET');
}
