import { proxyConstruction } from '@/lib/construction-proxy';

export async function POST(request: Request) {
  const body = await request.json();
  return proxyConstruction('/construction/categories', 'POST', body);
}
