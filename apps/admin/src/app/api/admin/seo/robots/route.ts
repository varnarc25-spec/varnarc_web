import { proxySeo } from '@/lib/seo-proxy';

export async function GET() {
  return proxySeo('/robots/settings', 'GET');
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxySeo('/robots/settings', 'PUT', body);
}
