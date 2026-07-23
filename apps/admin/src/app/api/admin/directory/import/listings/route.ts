import { proxyDirectoryImport } from '@/lib/directory-proxy';

export async function POST(request: Request) {
  const formData = await request.formData();
  return proxyDirectoryImport(formData);
}
