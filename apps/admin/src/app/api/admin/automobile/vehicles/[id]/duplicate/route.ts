import { proxyAutomobile } from '@/lib/automobile-proxy';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyAutomobile(`/automobile/vehicles/${id}/duplicate`, 'POST');
}
