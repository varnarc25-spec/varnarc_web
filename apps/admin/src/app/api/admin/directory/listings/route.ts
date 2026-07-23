import { proxyDirectory } from '@/lib/directory-proxy';

export async function GET(request: Request) {
  return proxyDirectory('/directory/listings/admin', 'GET', undefined, request);
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyDirectory('/directory/listings', 'POST', body);
}
