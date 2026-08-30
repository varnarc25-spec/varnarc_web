'use client';

import { cn } from '@/components/construction/styles';

/** Shared wall elevation with opening cutouts for brick / AAC calculators. */
export function MasonryWallDiagram({
  openingRatio = 0,
  className,
  caption = 'L × H wall · openings deducted',
}: {
  openingRatio?: number;
  className?: string;
  caption?: string;
}) {
  const ratio = Math.min(0.7, Math.max(0, openingRatio));
  const openingW = 40 + ratio * 80;
  const openingH = 50 + ratio * 30;
  const ox = 120 - openingW / 2;
  const oy = 35;

  return (
    <figure
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-orange-50/80 to-white p-4',
        className,
      )}
      aria-label="Wall elevation diagram"
    >
      <svg viewBox="0 0 240 140" className="mx-auto h-auto w-full max-w-xs" role="img">
        <title>Wall with openings</title>
        <rect
          x="30"
          y="20"
          width="180"
          height="100"
          rx="2"
          fill="#0b1f3a"
          fillOpacity="0.08"
          stroke="#0b1f3a"
          strokeWidth="2"
        />
        {[40, 55, 70, 85, 100].map((y) => (
          <line
            key={y}
            x1="30"
            y1={y}
            x2="210"
            y2={y}
            stroke="#0b1f3a"
            strokeOpacity="0.15"
            strokeWidth="1"
          />
        ))}
        {ratio > 0.02 ? (
          <rect
            x={ox}
            y={oy}
            width={openingW}
            height={openingH}
            fill="#fff"
            stroke="#f97316"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        ) : null}
        <text x="120" y="132" textAnchor="middle" fill="#64748b" fontSize="10">
          {caption}
        </text>
      </svg>
      <figcaption className="mt-1 text-center text-xs text-slate-500">
        Visual guide only — not to scale
      </figcaption>
    </figure>
  );
}
