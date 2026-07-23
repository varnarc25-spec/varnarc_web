import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const ENTITY_EXPORT_PATH: Record<string, string> = {
  materials: '/construction/admin/export/materials',
  brands: '/construction/admin/export/brands',
  'cost-templates': '/construction/admin/export/cost-templates',
  projects: '/construction/admin/export/projects',
};

const ENTITY_IMPORT_PATH: Record<string, string> = {
  materials: '/construction/admin/import/materials',
  brands: '/construction/admin/import/brands',
  'cost-templates': '/construction/admin/import/cost-templates',
  projects: '/construction/admin/import/projects',
};

export async function proxyConstruction(
  path: string,
  method: string,
  body?: unknown,
  request?: Request,
) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  let url = `${apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (request && method === 'GET') {
    const qs = new URL(request.url).searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}

export async function proxyConstructionExport(entity: string) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const path = ENTITY_EXPORT_PATH[entity];
  if (!path) {
    return NextResponse.json({ error: { message: 'Unknown entity' } }, { status: 400 });
  }

  const res = await fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  }

  const csv = await res.text();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${entity}.csv"`,
    },
  });
}

export async function proxyConstructionImport(entity: string, formData: FormData) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const path = ENTITY_IMPORT_PATH[entity];
  if (!path) {
    return NextResponse.json({ error: { message: 'Unknown entity' } }, { status: 400 });
  }

  const res = await fetch(`${apiUrl}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
