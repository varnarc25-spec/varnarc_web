import { proxyPlatformApi } from '@/lib/platform-api-proxy';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return proxyPlatformApi(`/webhooks/${id}/test`, 'POST', body);
}
