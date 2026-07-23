import { proxyDirectory } from '@/lib/directory-proxy';

export async function GET(request: Request) {
  return proxyDirectory('/directory/categories', 'GET', undefined, request);
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyDirectory('/directory/categories', 'POST', body);
}
