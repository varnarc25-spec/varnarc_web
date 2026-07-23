import { proxySecurityApi } from '@/lib/security-api-proxy';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxySecurityApi('/security/revoke-sessions', 'POST', body, req);
}
