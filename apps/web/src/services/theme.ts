import { apiPublicFetch } from '@/services/api-client';

export type ActiveTheme = {
  id: string;
  slug: string;
  name: string;
  branding?: {
    siteName?: string | null;
    siteTagline?: string | null;
    logoUrl?: string | null;
    darkLogoUrl?: string | null;
    faviconUrl?: string | null;
    appleTouchIconUrl?: string | null;
    ogImageUrl?: string | null;
  } | null;
  colors?: unknown;
  fonts?: {
    body?: string | null;
    heading?: string | null;
    baseSize?: string | null;
    googleFonts?: string[] | null;
  } | null;
  tokens?: {
    layout?: Record<string, unknown>;
    navigation?: { stickyHeader?: boolean | null };
    footer?: {
      copyright?: string | null;
      socialLinks?: Array<{ label: string; href: string }> | null;
      newsletterEnabled?: boolean | null;
      showAds?: boolean | null;
    };
  } | null;
  googleFonts?: string[];
  cssStyleBlock?: string;
  resolvedCssVars?: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
};

export async function fetchActiveTheme(): Promise<ActiveTheme | null> {
  try {
    const { data } = await apiPublicFetch<ActiveTheme>('/theme', {
      next: { revalidate: 60 },
    });
    return data;
  } catch {
    return null;
  }
}

export function googleFontsHref(fonts: string[] | null | undefined): string | null {
  if (!fonts?.length) return null;
  const families = fonts
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => `family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@400;500;600;700`)
    .join('&');
  if (!families) return null;
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
