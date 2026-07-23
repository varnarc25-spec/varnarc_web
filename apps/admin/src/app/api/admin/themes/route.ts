import { proxyTheme } from '@/lib/theme-proxy';

export async function POST(request: Request) {
  return proxyTheme('/theme/presets', 'POST', await request.json());
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { id?: string } & Record<string, unknown>;
  const { id, ...rest } = body;
  if (!id) {
    return proxyTheme('/theme', 'PUT', rest);
  }
  return proxyTheme(`/theme/presets/${id}`, 'PUT', rest);
}
