import { proxySeo } from '@/lib/seo-proxy';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return proxySeo(`/redirects/${id}`, 'PUT', body);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxySeo(`/redirects/${id}`, 'DELETE');
}
