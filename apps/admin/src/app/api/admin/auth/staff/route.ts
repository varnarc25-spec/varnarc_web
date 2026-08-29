import { proxyAdminApi } from '@/lib/admin-api-proxy';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyAdminApi('/auth/admin/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
