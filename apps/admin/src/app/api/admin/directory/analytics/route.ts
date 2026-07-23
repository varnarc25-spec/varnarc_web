import { proxyDirectory } from '@/lib/directory-proxy';

export async function GET() {
  return proxyDirectory('/directory/analytics', 'GET');
}
