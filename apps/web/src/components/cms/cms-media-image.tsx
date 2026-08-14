import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';

export type CmsMediaVariant = {
  url: string;
  width?: number | null;
  height?: number | null;
  label?: string | null;
  format?: string | null;
};

export type CmsMediaImageProps = {
  src: string;
  alt: string;
  title?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  /** Optional CMS variants (used when Next optimizer is not applicable). */
  variants?: CmsMediaVariant[] | null;
  srcSet?: string | null;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Eager + high fetch priority. Prefer only for true LCP candidates. */
  priority?: boolean;
  /**
   * Art-direction media query. When set, the real asset is only requested if the
   * query matches (small viewports get a tiny SVG placeholder).
   */
  media?: string;
  objectFit?: 'cover' | 'contain';
  decoding?: 'async' | 'auto' | 'sync';
};

const TRANSPARENT_PIXEL =
  'data:image/svg+xml,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>`);

function isSvg(src: string) {
  return /\.svg(?:\?|$)/i.test(src) || src.startsWith('data:image/svg');
}

function isDataUrl(src: string) {
  return src.startsWith('data:');
}

/** Paths Next can optimize (local or allowlisted remotes in next.config). */
function canUseNextImage(src: string) {
  if (!src || isDataUrl(src) || isSvg(src)) return false;
  if (src.startsWith('/')) return true;
  try {
    const host = new URL(src).hostname;
    return (
      host === 'storage.googleapis.com' ||
      host.endsWith('.googleusercontent.com') ||
      host === 'res.cloudinary.com' ||
      host.endsWith('.cloudinary.com')
    );
  } catch {
    return false;
  }
}

function variantFormat(v: CmsMediaVariant): string {
  const label = (v.label || '').toLowerCase();
  const fmt = (v.format || '').toLowerCase();
  if (fmt) return fmt;
  if (label.includes('avif')) return 'avif';
  if (label.includes('webp')) return 'webp';
  const m = v.url.toLowerCase().match(/\.(avif|webp|jpe?g|png|gif)(?:\?|$)/);
  return m?.[1]?.replace('jpg', 'jpeg') || '';
}

function buildSrcSetForFormat(
  variants: CmsMediaVariant[] | null | undefined,
  format?: string,
): string | undefined {
  if (!variants?.length) return undefined;
  const rows = variants
    .filter((v) => {
      if (!v.url) return false;
      if (!format) {
        const f = variantFormat(v);
        return !f || f === 'jpeg' || f === 'png' || f === 'gif' || labelLooksOriginal(v);
      }
      return variantFormat(v) === format || (v.label || '').toLowerCase().includes(format);
    })
    .map((v) => ({
      url: v.url,
      w: v.width && v.width > 0 ? v.width : null,
    }));

  if (!rows.length) return undefined;
  const withWidth = rows.filter((r): r is { url: string; w: number } => r.w != null);
  if (withWidth.length >= 2) {
    return [...withWidth]
      .sort((a, b) => a.w - b.w)
      .map((r) => `${r.url} ${r.w}w`)
      .join(', ');
  }
  return rows[0]?.url;
}

function labelLooksOriginal(v: CmsMediaVariant): boolean {
  const label = (v.label || '').toLowerCase();
  return !label || label.includes('original') || label.includes('full');
}

/**
 * CLS-safe CMS/media image.
 * - Raster local/GCS/Cloudinary → next/image (AVIF/WebP + responsive srcset via Next).
 * - SVG / art-directed hero → <picture>/<img> (no invented transforms).
 */
export function CmsMediaImage({
  src,
  alt,
  title,
  caption,
  width,
  height,
  variants,
  srcSet,
  className,
  imgClassName,
  sizes = '100vw',
  loading = 'lazy',
  fetchPriority,
  priority = false,
  media,
  objectFit = 'cover',
  decoding = 'async',
}: CmsMediaImageProps) {
  const w = width && width > 0 ? width : 16;
  const h = height && height > 0 ? height : 16;
  const resolvedLoading = priority ? 'eager' : loading;
  const resolvedPriority = priority ? ('high' as const) : fetchPriority;
  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';
  const sharedClass = `h-full w-full ${fitClass} ${imgClassName ?? ''}`.trim();

  let image: ReactNode;

  if (media) {
    const avifSrcSet = buildSrcSetForFormat(variants, 'avif');
    const webpSrcSet = buildSrcSetForFormat(variants, 'webp');
    const rasterSrcSet = srcSet?.trim() || buildSrcSetForFormat(variants) || src;
    image = (
      <picture>
        {avifSrcSet ? (
          <source media={media} srcSet={avifSrcSet} type="image/avif" sizes={sizes} />
        ) : null}
        {webpSrcSet ? (
          <source media={media} srcSet={webpSrcSet} type="image/webp" sizes={sizes} />
        ) : null}
        <source media={media} srcSet={rasterSrcSet} sizes={sizes} />
        <img
          src={TRANSPARENT_PIXEL}
          alt={alt}
          title={title || undefined}
          width={w}
          height={h}
          sizes={sizes}
          loading={resolvedLoading}
          decoding={decoding}
          fetchPriority={resolvedPriority}
          className={sharedClass}
        />
      </picture>
    );
  } else if (canUseNextImage(src)) {
    image = (
      <Image
        src={src}
        alt={alt}
        title={title || undefined}
        width={w}
        height={h}
        sizes={sizes}
        loading={resolvedLoading}
        // Avoid Next auto-preload without media control; callers use CmsMediaPreload when needed.
        priority={false}
        fetchPriority={resolvedPriority}
        decoding={decoding}
        className={sharedClass}
        style={{ width: '100%', height: '100%' } satisfies CSSProperties}
      />
    );
  } else {
    const avifSrcSet = buildSrcSetForFormat(variants, 'avif');
    const webpSrcSet = buildSrcSetForFormat(variants, 'webp');
    const rasterSrcSet =
      srcSet?.trim() || buildSrcSetForFormat(variants) || (width ? `${src} ${width}w` : undefined);
    image = (
      <picture>
        {avifSrcSet ? <source srcSet={avifSrcSet} type="image/avif" sizes={sizes} /> : null}
        {webpSrcSet ? <source srcSet={webpSrcSet} type="image/webp" sizes={sizes} /> : null}
        <img
          src={src}
          srcSet={rasterSrcSet || undefined}
          alt={alt}
          title={title || undefined}
          width={w}
          height={h}
          sizes={sizes}
          loading={resolvedLoading}
          decoding={decoding}
          fetchPriority={resolvedPriority}
          className={sharedClass}
        />
      </picture>
    );
  }

  if (!caption) {
    return className ? <div className={className}>{image}</div> : image;
  }

  return (
    <figure className={className}>
      {image}
      <figcaption className="mt-2 text-xs leading-relaxed text-slate-500">{caption}</figcaption>
    </figure>
  );
}

/** Desktop+ preload for LCP hero images that are not shown on small screens. */
export function CmsMediaPreload({
  href,
  media = '(min-width: 640px)',
}: {
  href: string;
  media?: string;
}) {
  if (!href.trim() || isDataUrl(href)) return null;
  return <link rel="preload" as="image" href={href} media={media} fetchPriority="high" />;
}
