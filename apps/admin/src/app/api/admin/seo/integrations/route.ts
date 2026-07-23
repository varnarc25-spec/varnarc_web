import { proxySeo } from '@/lib/seo-proxy';

export async function GET() {
  return proxySeo('/integrations', 'GET');
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxySeo('/integrations', 'PUT', body);
}
