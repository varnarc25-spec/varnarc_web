import type { Metadata } from 'next';
import { apiPublicFetch } from '@/services/api-client';

export type SeoOverride = {
  title?: string | null;
  description?: string | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  robots?: string | null;
  twitterCard?: string | null;
  schemaType?: string | null;
  language?: string | null;
};

export type SeoMetadataInput = {
  entityType: string;
  entityId?: string;
  path: string;
  title: string;
  description?: string | null;
  image?: string | null;
};

const siteUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function fetchSeoOverride(
  entityType: string,
  entityId: string,
): Promise<SeoOverride | null> {
  try {
    const { data } = await apiPublicFetch<SeoOverride | null>(
      `/seo/meta/${entityType}/${entityId}`,
      { next: { revalidate: 120 } },
    );
    return data;
  } catch {
    return null;
  }
}

function parseRobots(robots?: string | null): Metadata['robots'] | undefined {
  if (!robots?.trim()) return undefined;
  const value = robots.toLowerCase();
  return {
    index: !value.includes('noindex'),
    follow: !value.includes('nofollow'),
  };
}

/** Merge entity defaults with centralized seo_metadata overrides. */
export async function buildSeoMetadata(input: SeoMetadataInput): Promise<Metadata> {
  const baseUrl = siteUrl();
  const path = input.path.startsWith('/') ? input.path : `/${input.path}`;
  const override =
    input.entityId != null
      ? await fetchSeoOverride(input.entityType, input.entityId)
      : null;

  const title = override?.title?.trim() || input.title;
  const description =
    override?.description?.trim() || input.description?.trim() || undefined;
  const canonical =
    override?.canonicalUrl?.trim() ||
    (path.startsWith('http') ? path : `${baseUrl}${path}`);
  const ogImage = override?.ogImage?.trim() || input.image?.trim() || undefined;
  const twitterCard =
    override?.twitterCard === 'summary_large_image' ? 'summary_large_image' : 'summary';

  return {
    title,
    description,
    keywords: override?.metaKeywords?.trim() || undefined,
    alternates: {
      canonical: canonical.startsWith('http') ? canonical : path,
    },
    robots: parseRobots(override?.robots),
    openGraph: {
      title,
      description,
      url: canonical.startsWith('http') ? canonical : `${baseUrl}${path}`,
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
      locale: override?.language ?? undefined,
    },
    twitter: {
      card: twitterCard,
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
