import { proxyAdminApi } from '@/lib/admin-api-proxy';

export async function POST(request: Request) {
  const body = await request.json();
  return proxyAdminApi('/menus', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
