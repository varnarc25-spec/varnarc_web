import { proxySearch } from '@/lib/search-proxy';

export async function POST() {
  return proxySearch('/search/cache/clear', 'POST', {});
}
