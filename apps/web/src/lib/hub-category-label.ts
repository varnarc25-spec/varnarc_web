/** Normalize CMS category fields (string or { name }) for hub guide cards. */
export function hubCategoryLabel(category: unknown, fallback = 'Guide'): string {
  if (category == null) return fallback;
  if (typeof category === 'string') return category;
  if (typeof category === 'object' && category !== null && 'name' in category) {
    const name = (category as { name?: unknown }).name;
    if (typeof name === 'string' && name.trim()) return name;
  }
  return fallback;
}
