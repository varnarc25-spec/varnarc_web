import { proxySettings } from '@/lib/settings-proxy';

export async function GET() {
  return proxySettings('/adsense', 'GET');
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxySettings('/adsense', 'PUT', body);
}
