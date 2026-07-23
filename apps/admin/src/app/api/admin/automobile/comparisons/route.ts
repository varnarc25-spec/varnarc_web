import { proxyAutomobile } from '@/lib/automobile-proxy';

export async function GET() {
  return proxyAutomobile('/automobile/admin/comparisons', 'GET');
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyAutomobile('/automobile/admin/comparisons', 'POST', body);
}
