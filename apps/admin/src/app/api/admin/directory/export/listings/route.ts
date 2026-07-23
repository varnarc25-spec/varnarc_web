import { proxyDirectoryExport } from '@/lib/directory-proxy';

export async function GET() {
  return proxyDirectoryExport();
}
