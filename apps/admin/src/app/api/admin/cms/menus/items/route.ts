import { proxyAdminApi } from '@/lib/admin-api-proxy';

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown> & { menuId: string };
  const { menuId, ...rest } = body;
  return proxyAdminApi(`/menus/${menuId}/items`, {
    method: 'POST',
    body: JSON.stringify(rest),
  });
}
