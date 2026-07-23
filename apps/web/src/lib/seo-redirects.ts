const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type RedirectRow = {
  sourcePath: string;
  targetPath: string;
  redirectType: number;
};

let cache: { map: Map<string, RedirectRow>; expires: number } | null = null;

async function loadRedirects(): Promise<Map<string, RedirectRow>> {
  const now = Date.now();
  if (cache && cache.expires > now) return cache.map;

  try {
    const res = await fetch(`${apiUrl}/seo/redirects/active`, { next: { revalidate: 60 } });
    const json = (await res.json()) as { data?: RedirectRow[] };
    const map = new Map<string, RedirectRow>();
    for (const row of json.data ?? []) {
      map.set(row.sourcePath, row);
    }
    cache = { map, expires: now + 60_000 };
    return map;
  } catch {
    return cache?.map ?? new Map();
  }
}

export async function resolveSeoRedirect(pathname: string) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const map = await loadRedirects();
  return map.get(normalized) ?? null;
}
