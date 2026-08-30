import { proxyConstructionSeoAudit } from '@/lib/construction-seo-audit-proxy';

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  return proxyConstructionSeoAudit(`/issues/${id}`, 'PUT', body);
}
