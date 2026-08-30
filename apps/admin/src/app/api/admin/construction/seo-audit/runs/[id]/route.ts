import { proxyConstructionSeoAudit } from '@/lib/construction-seo-audit-proxy';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyConstructionSeoAudit(`/runs/${id}`, 'GET');
}
