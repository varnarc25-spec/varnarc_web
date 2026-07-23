import { proxyFinanceExport } from '@/lib/finance-proxy';

export async function GET(
  _request: Request,
  context: { params: Promise<{ entity: string }> },
) {
  const { entity } = await context.params;
  return proxyFinanceExport(entity);
}
