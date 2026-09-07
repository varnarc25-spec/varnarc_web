import { proxyAdminApi } from '@/lib/admin-api-proxy';

export async function GET(_request: Request, context: { params: Promise<{ pageKey: string }> }) {
  const { pageKey } = await context.params;
  return proxyAdminApi(`/construction/admin/pages/${pageKey}`, { method: 'GET' });
}

export async function PUT(request: Request, context: { params: Promise<{ pageKey: string }> }) {
  const { pageKey } = await context.params;
  const body = await request.json();
  return proxyAdminApi(`/construction/admin/pages/${pageKey}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
