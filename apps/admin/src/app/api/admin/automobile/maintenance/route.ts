import { proxyAutomobile } from '@/lib/automobile-proxy';

export async function GET() {
  return proxyAutomobile('/automobile/admin/maintenance', 'GET');
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyAutomobile('/automobile/maintenance', 'POST', body);
}
