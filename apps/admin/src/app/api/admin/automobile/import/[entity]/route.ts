import { proxyAutomobileImport } from '@/lib/automobile-proxy';

export async function POST(
  request: Request,
  context: { params: Promise<{ entity: string }> },
) {
  const { entity } = await context.params;
  const formData = await request.formData();
  return proxyAutomobileImport(entity, formData);
}
