import { proxyConstructionImport } from '@/lib/construction-proxy';

export async function POST(
  request: Request,
  context: { params: Promise<{ entity: string }> },
) {
  const { entity } = await context.params;
  const formData = await request.formData();
  return proxyConstructionImport(entity, formData);
}
