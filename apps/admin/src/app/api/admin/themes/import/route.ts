import { proxyTheme } from '@/lib/theme-proxy';

export async function POST(request: Request) {
  return proxyTheme('/theme/presets/import', 'POST', await request.json());
}
