import { proxyTheme } from '@/lib/theme-proxy';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  if (url.searchParams.get('action') === 'reset') {
    return proxyTheme(`/theme/presets/${id}/reset`, 'POST');
  }
  return proxyTheme(`/theme/presets/${id}/publish`, 'POST');
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyTheme(`/theme/presets/${id}`, 'DELETE');
}
