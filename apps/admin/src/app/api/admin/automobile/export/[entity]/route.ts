import { proxyAutomobileExport } from '@/lib/automobile-proxy';

export async function GET(
  _request: Request,
  context: { params: Promise<{ entity: string }> },
) {
  const { entity } = await context.params;
  return proxyAutomobileExport(entity);
}
