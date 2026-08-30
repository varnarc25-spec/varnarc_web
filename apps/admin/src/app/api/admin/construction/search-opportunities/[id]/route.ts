import { proxyConstructionSearchOpportunities } from '@/lib/construction-search-opportunity-proxy';

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  return proxyConstructionSearchOpportunities(`/${id}`, 'PUT', body);
}
