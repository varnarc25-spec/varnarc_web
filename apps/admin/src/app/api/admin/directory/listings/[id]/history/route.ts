import { proxyDirectory } from '@/lib/directory-proxy';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyDirectory(`/directory/listings/admin/${id}/history`, 'GET');
}
