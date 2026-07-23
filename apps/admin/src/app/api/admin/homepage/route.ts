import { proxyHomepage } from '@/lib/homepage-proxy';

export async function GET() {
  return proxyHomepage('', 'GET');
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return proxyHomepage('', 'POST', body);
}
