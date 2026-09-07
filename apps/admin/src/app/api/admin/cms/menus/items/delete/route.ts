import { proxyAdminApi } from '@/lib/admin-api-proxy';

export async function POST(request: Request) {
  const body = (await request.json()) as { menuId: string; itemId: string };
  return proxyAdminApi(`/menus/${body.menuId}/items/${body.itemId}`, {
    method: 'DELETE',
  });
}
