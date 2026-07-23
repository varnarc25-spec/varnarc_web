import { proxyHomepage } from '@/lib/homepage-proxy';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyHomepage(`/${id}/publish`, 'POST');
}
