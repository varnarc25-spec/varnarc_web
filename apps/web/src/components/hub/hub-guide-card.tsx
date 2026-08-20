'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { useState } from 'react';
import { hubCategoryLabel } from '@/lib/hub-category-label';
import type { HubGuideItem } from '@/components/hub/hub-guide-card-types';

const PLACEHOLDER_GRADIENTS = [
  'from-blue-500/90 to-cyan-400/90',
  'from-violet-500/90 to-purple-400/90',
  'from-emerald-500/90 to-teal-400/90',
  'from-amber-500/90 to-orange-400/90',
];

export function HubGuideCard({ item, index }: { item: HubGuideItem; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = item.imageUrl && !imageFailed;
  const gradient = PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length];

  return (
    <Link
      href={item.href}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white transition hover:border-blue-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-200">
        {showImage ? (
          <img
            src={item.imageUrl!}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} aria-hidden />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {item.category ? (
          <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
            {hubCategoryLabel(item.category)}
          </span>
        ) : null}
        <h3 className="mt-1.5 text-base font-bold leading-snug text-[#0b1f3a] group-hover:text-blue-700 line-clamp-3">
          {item.title}
        </h3>
        {item.readMinutes != null ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {item.readMinutes} min read
          </p>
        ) : null}
      </div>
    </Link>
  );
}
