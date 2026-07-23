import { proxyAutomobile } from '@/lib/automobile-proxy';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyAutomobile(`/automobile/manufacturers/${id}`, 'GET');
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  return proxyAutomobile(`/automobile/manufacturers/${id}`, 'PUT', body);
}
