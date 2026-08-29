import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session';

export async function GET(req: Request) {
  const url = new URL('/login', req.url);
  const response = NextResponse.redirect(url);
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}

export async function POST(req: Request) {
  return GET(req);
}
