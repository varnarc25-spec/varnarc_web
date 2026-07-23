import { proxyAutomobile } from '@/lib/automobile-proxy';

export async function GET() {
  return proxyAutomobile('/automobile/admin/review-options', 'GET');
}
