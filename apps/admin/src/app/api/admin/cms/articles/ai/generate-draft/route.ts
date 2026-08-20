import { proxyAdminApi } from '@/lib/admin-api-proxy';

export async function POST(request: Request) {
  const body = await request.json();
  return proxyAdminApi('/articles/ai/generate-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
