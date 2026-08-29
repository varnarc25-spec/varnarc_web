/** Default public-site SEO copy — keep title ~50–60 chars and description ~150–160. */
export const DEFAULT_SEO_TITLE =
  'Varnarc — Financial Calculators, Guides, Comparisons & Smart Tools for India';

export const DEFAULT_SEO_DESCRIPTION =
  'Free EMI calculators, loan comparisons, expert reviews, construction cost tools & solar calculators. Make smarter financial and lifestyle decisions with Varnarc.';

export const DEFAULT_OG_IMAGE_PATH = '/brand/logo.png';

export function seoDescriptionFromTagline(tagline: string | null | undefined): string {
  const value = tagline?.trim() ?? '';
  return value.length >= 70 ? value : DEFAULT_SEO_DESCRIPTION;
}

export function seoTitleFromBranding(siteName: string, tagline: string): string {
  const name = siteName.trim() || 'Varnarc';
  const line = tagline.trim();
  if (line.length >= 24) return `${name} — ${line}`.slice(0, 70);
  return DEFAULT_SEO_TITLE;
}
