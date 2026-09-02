import { proxyAutomobile } from '@/lib/automobile-proxy';

export async function POST(request: Request) {
  const body = await request.json();
  return proxyAutomobile('/automobile/admin/vehicles/refresh-prices', 'POST', body);
}
