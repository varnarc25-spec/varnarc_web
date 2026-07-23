import { proxyAiToolsExport } from '@/lib/ai-tools-proxy';

export async function GET() {
  return proxyAiToolsExport();
}
