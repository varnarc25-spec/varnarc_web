import { proxyPlatformApi } from '@/lib/platform-api-proxy';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return proxyPlatformApi(`/webhooks/${id}`, 'PUT', body);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPlatformApi(`/webhooks/${id}`, 'DELETE');
}
