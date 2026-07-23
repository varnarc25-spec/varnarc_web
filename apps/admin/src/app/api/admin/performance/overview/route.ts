import { NextRequest } from 'next/server';
import { proxyPerformanceApi } from '@/lib/performance-api-proxy';

export async function GET(request: NextRequest) {
  return proxyPerformanceApi('/performance/overview', 'GET', undefined, request);
}
