import { getPublicSiteUrlSync } from '@/lib/public-site-url';

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function absoluteUrl(path = '/') {
  const base = getPublicSiteUrlSync();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
