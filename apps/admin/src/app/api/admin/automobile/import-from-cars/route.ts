import { proxyAutomobileImportFromCars } from '@/lib/automobile-proxy';

export const maxDuration = 300;

export async function POST() {
  return proxyAutomobileImportFromCars();
}
