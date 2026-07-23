'use client';

import { getCategoryIconDef, resolveCategorySlugForIcon } from '@/lib/article-category-icons';

type ThumbnailSize = 'sm' | 'md';

const sizeClasses: Record<ThumbnailSize, { box: string; iconScale: string }> = {
  sm: { box: 'h-12 w-12 shrink-0 rounded-lg', iconScale: '[&_svg]:h-5 [&_svg]:w-5' },
  md: { box: 'aspect-[16/9] w-full rounded-t-lg', iconScale: '[&_svg]:h-8 [&_svg]:w-8' },
};

export function ArticleThumbnail({
  title: _title,
  imageUrl,
  category,
  categorySlug,
  size = 'md',
  className = '',
}: {
  title: string;
  imageUrl?: string | null;
  category?: { slug: string; parent?: { slug: string } | null } | null;
  categorySlug?: string | null;
  size?: ThumbnailSize;
  className?: string;
}) {
  const slug = categorySlug ?? resolveCategorySlugForIcon(category);
  const sizes = sizeClasses[size];

  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-slate-100 ${sizes.box} ${className}`}>
        <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }

  const def = getCategoryIconDef(slug);

  return (
    <div
      className={`flex items-center justify-center ${def.bg} ${sizes.box} ${className}`}
      title={def.label}
      aria-hidden
    >
      <span className={`${def.fg} ${sizes.iconScale}`}>{def.icon}</span>
    </div>
  );
}
