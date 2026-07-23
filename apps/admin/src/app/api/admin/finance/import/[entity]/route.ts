import { proxyFinanceImport } from '@/lib/finance-proxy';

export async function POST(
  request: Request,
  context: { params: Promise<{ entity: string }> },
) {
  const { entity } = await context.params;
  const formData = await request.formData();
  return proxyFinanceImport(entity, formData);
}
