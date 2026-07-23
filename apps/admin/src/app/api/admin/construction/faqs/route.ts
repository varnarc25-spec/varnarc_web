import { proxyConstruction } from '@/lib/construction-proxy';

export async function GET(request: Request) {
  return proxyConstruction('/construction/admin/faqs', 'GET', undefined, request);
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyConstruction('/construction/admin/faqs', 'POST', body);
}
