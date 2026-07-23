import { proxySettings } from '@/lib/settings-proxy';

export async function GET() {
  return proxySettings('/general', 'GET');
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxySettings('/general', 'PUT', body);
}
