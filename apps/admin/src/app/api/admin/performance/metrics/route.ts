import { NextRequest } from 'next/server';
import { proxyPerformanceApi } from '@/lib/performance-api-proxy';

export async function GET(request: NextRequest) {
  return proxyPerformanceApi('/metrics', 'GET', undefined, request);
}
