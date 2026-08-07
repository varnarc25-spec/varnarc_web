import { proxySeo } from '@/lib/seo-proxy';

export async function GET(
  _request: Request,
  context: { params: Promise<{ entityType: string; entityId: string }> },
) {
  const { entityType, entityId } = await context.params;
  return proxySeo(`/meta/${entityType}/${entityId}`, 'GET');
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ entityType: string; entityId: string }> },
) {
  const { entityType, entityId } = await context.params;
  const body = await request.json();
  return proxySeo(`/meta/${entityType}/${entityId}`, 'PUT', body);
}
