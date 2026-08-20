import { proxySettings } from '@/lib/settings-proxy';

export async function GET() {
  return proxySettings('/contact', 'GET');
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxySettings('/contact', 'PUT', body);
}
