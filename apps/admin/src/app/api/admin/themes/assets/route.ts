import { proxyTheme } from '@/lib/theme-proxy';

export async function POST(request: Request) {
  return proxyTheme('/theme/assets', 'POST', await request.json());
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return Response.json({ error: { message: 'id is required' } }, { status: 400 });
  }
  return proxyTheme(`/theme/assets/${id}`, 'DELETE');
}
