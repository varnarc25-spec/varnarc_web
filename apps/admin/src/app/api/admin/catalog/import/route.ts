import { proxyCatalogImport } from '@/lib/catalog-proxy';

export async function POST(request: Request) {
  return proxyCatalogImport(request);
}
