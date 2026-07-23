import { NextRequest } from 'next/server';
import { proxyPerformanceApi } from '@/lib/performance-api-proxy';

export async function GET(request: NextRequest) {
  return proxyPerformanceApi('/performance/cache', 'GET', undefined, request);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyPerformanceApi('/performance/cache/clear', 'POST', body, request);
}
