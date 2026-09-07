import { proxyAdminApi } from '@/lib/admin-api-proxy';

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown> & {
    menuId: string;
    itemId: string;
  };
  const { menuId, itemId, ...rest } = body;
  return proxyAdminApi(`/menus/${menuId}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(rest),
  });
}
