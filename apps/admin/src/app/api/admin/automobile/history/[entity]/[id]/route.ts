import { proxyAutomobile } from '@/lib/automobile-proxy';

export async function GET(
  _request: Request,
  context: { params: Promise<{ entity: string; id: string }> },
) {
  const { entity, id } = await context.params;
  return proxyAutomobile(`/automobile/admin/history/${entity}/${id}`, 'GET');
}
