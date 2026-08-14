import type { ReactNode } from 'react';
import { CmsMediaImage } from '@/components/cms/cms-media-image';

/**
 * Shared illustration frame for loan hub visuals.
 * Enforces consistent aspect, background, and object-fit so CMS art stays visually aligned.
 */
export function LoanIllustrationFrame({
  src,
  alt,
  sizes,
  aspect = '4/3',
  objectFit = 'contain',
  className = '',
  imgClassName = '',
  loading = 'lazy',
  fetchPriority = 'low',
  width = 480,
  height = 360,
  hoverScale = false,
  fallback,
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  aspect?: '4/3' | '16/10' | '16/9' | 'video';
  objectFit?: 'contain' | 'cover';
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  width?: number;
  height?: number;
  hoverScale?: boolean;
  fallback?: ReactNode;
}) {
  const aspectClass =
    aspect === '16/10'
      ? 'aspect-[16/10]'
      : aspect === '16/9' || aspect === 'video'
        ? 'aspect-video'
        : 'aspect-[4/3]';

  if (!src?.trim()) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#e8eef5] via-[#f8fafc] to-[#fff7ed]/70 ${aspectClass} ${className}`}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#f7f9fc] ${aspectClass} ${className}`}>
      <CmsMediaImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        objectFit={objectFit}
        loading={loading}
        fetchPriority={fetchPriority}
        imgClassName={`p-2 sm:p-3 ${
          hoverScale
            ? 'transition duration-300 group-hover:scale-[1.02] motion-reduce:transform-none motion-reduce:transition-none'
            : ''
        } ${imgClassName}`.trim()}
      />
    </div>
  );
}
