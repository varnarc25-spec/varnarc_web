import { proxySearch } from '@/lib/search-proxy';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params;
  return proxySearch(`/search/reindex/${jobId}`, 'GET');
}
