import { getApiBaseUrl } from '@/lib/runtime-public-env';

const MEDIA_PUBLIC_ID =
  /\/media\/public\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

function isUnusableHost(url: string) {
  try {
    const host = new URL(url, 'https://varnarc.com').hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  } catch {
    return true;
  }
}

/**
 * CMS uploads are often stored as `{API}/media/public/{id}` at upload time.
 * That host can be localhost or a stale Cloud Run URL. Rebuild from the live API
 * base when we have a media id.
 */
export function resolvePublicCmsMediaUrl(
  url?: string | null,
  mediaId?: string | null,
): string | null {
  const trimmed = url?.trim() || '';
  const idFromUrl = trimmed.match(MEDIA_PUBLIC_ID)?.[1] ?? null;
  const id = mediaId?.trim() || idFromUrl || null;

  if (id && (!trimmed || isUnusableHost(trimmed) || idFromUrl)) {
    return `${getApiBaseUrl()}/media/public/${id}`;
  }

  return trimmed || null;
}
