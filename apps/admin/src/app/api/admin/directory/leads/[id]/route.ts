import { proxyDirectory } from '@/lib/directory-proxy';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();
  return proxyDirectory(`/directory/leads/${id}`, 'PUT', body);
}
