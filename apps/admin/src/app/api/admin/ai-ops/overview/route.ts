import { NextResponse } from 'next/server';
import { proxyAiOps } from '@/lib/ai-ops-proxy';

export async function GET() {
  return proxyAiOps('/ai/overview', 'GET');
}
