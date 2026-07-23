import { proxySettings } from '@/lib/settings-proxy';

export async function GET() {
  return proxySettings('/security', 'GET');
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxySettings('/security', 'PUT', body);
}
