import { proxyDirectory } from '@/lib/directory-proxy';

export async function GET(request: Request) {
  return proxyDirectory('/directory/leads', 'GET', undefined, request);
}
