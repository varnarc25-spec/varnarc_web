import { NextResponse } from 'next/server';
import { getApiAccessToken, getApiBaseUrl } from '@/lib/api';

const ENTITY_PATHS = [
  'manufacturers',
  'vehicles',
  'specs',
  'vehicle-images',
  'vehicle-reviews',
] as const;

export async function proxyAutomobile(
  path: string,
  method: string,
  body?: unknown,
  request?: Request,
) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const apiUrl = getApiBaseUrl();
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

export async function proxyAutomobileExport(entity: string) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  if (!ENTITY_PATHS.includes(entity as (typeof ENTITY_PATHS)[number])) {
    return NextResponse.json({ error: { message: 'Unknown entity' } }, { status: 400 });
  }

  const res = await fetch(`${getApiBaseUrl()}/automobile/admin/export/${entity}`, {
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

export async function proxyAutomobileImport(entity: string, formData: FormData) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  if (!ENTITY_PATHS.includes(entity as (typeof ENTITY_PATHS)[number])) {
    return NextResponse.json({ error: { message: 'Unknown entity' } }, { status: 400 });
  }

  const res = await fetch(`${getApiBaseUrl()}/automobile/admin/import/${entity}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}

export async function proxyAutomobileImportMerge(formData: FormData) {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const res = await fetch(`${getApiBaseUrl()}/automobile/admin/import-merge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}

export async function proxyAutomobileImportFromCars() {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const res = await fetch(`${getApiBaseUrl()}/automobile/admin/import-from-cars`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
