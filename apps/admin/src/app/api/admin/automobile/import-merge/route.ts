import { proxyAutomobileImportMerge } from '@/lib/automobile-proxy';

export const maxDuration = 300;

export async function POST(request: Request) {
  const formData = await request.formData();
  return proxyAutomobileImportMerge(formData);
}
