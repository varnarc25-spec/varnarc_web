import { proxyDirectory } from '@/lib/directory-proxy';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();
  return proxyDirectory(`/directory/listings/${id}`, 'PUT', body);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyDirectory(`/directory/listings/${id}`, 'DELETE');
}
