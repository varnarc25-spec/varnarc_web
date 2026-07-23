import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export const cmsCacheKeys = {
  articleSlug: (slug: string) => `cms:article:slug:${slug}`,
  pageSlug: (slug: string) => `cms:page:slug:${slug}`,
  menuLocation: (location: string) => `cms:menu:location:${location}`,
  articlesList: (query: string) => `cms:articles:list:${query}`,
};

export async function invalidateCmsCache(cache: Cache, keys: string[]) {
  await Promise.all(keys.map((key) => cache.del(key)));
}

export function estimateReadingTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export type { Cache };
export { CACHE_MANAGER };
