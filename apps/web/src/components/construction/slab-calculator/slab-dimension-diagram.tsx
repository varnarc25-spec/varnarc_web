'use client';

import { cn } from '@/components/construction/styles';

/** Visual slab L × W × T diagram with dimension callouts. */
export function SlabDimensionDiagram({
  lengthM,
  widthM,
  thicknessM,
  className,
}: {
  lengthM: number;
  widthM: number;
  thicknessM: number;
  className?: string;
}) {
  const fmt = (m: number) => {
    if (m >= 1) return `${Number(m.toFixed(2))} m`;
    return `${Number((m * 1000).toFixed(0))} mm`;
  };

  return (
    <figure
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-orange-50/60 to-white p-4',
        className,
      )}
      aria-label="Slab dimension diagram"
    >
      <svg viewBox="0 0 280 170" className="mx-auto h-auto w-full max-w-md" role="img">
        <title>
          Slab {fmt(lengthM)} × {fmt(widthM)} × {fmt(thicknessM)}
        </title>
        <defs>
          <marker id="slab-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
          </marker>
        </defs>
        {/* Isometric slab body */}
        <path
          d="M50 100 L120 55 L230 55 L160 100 Z"
          fill="#0b1f3a"
          fillOpacity="0.1"
          stroke="#0b1f3a"
          strokeWidth="2"
        />
        <path
          d="M50 100 L50 118 L160 118 L160 100 Z"
          fill="#f97316"
          fillOpacity="0.35"
          stroke="#0b1f3a"
          strokeWidth="1.5"
        />
        <path
          d="M160 100 L230 55 L230 73 L160 118 Z"
          fill="#0b1f3a"
          fillOpacity="0.06"
          stroke="#0b1f3a"
          strokeWidth="1.5"
        />
        {/* Length dimension */}
        <line
          x1="50"
          y1="135"
          x2="160"
          y2="135"
          stroke="#64748b"
          strokeWidth="1"
          markerEnd="url(#slab-arrow)"
          markerStart="url(#slab-arrow)"
        />
        <text x="105" y="150" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
          L = {fmt(lengthM)}
        </text>
        {/* Width dimension */}
        <line
          x1="175"
          y1="42"
          x2="235"
          y2="42"
          stroke="#64748b"
          strokeWidth="1"
          markerEnd="url(#slab-arrow)"
        />
        <text x="205" y="36" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
          W = {fmt(widthM)}
        </text>
        {/* Thickness dimension */}
        <line
          x1="245"
          y1="55"
          x2="245"
          y2="100"
          stroke="#64748b"
          strokeWidth="1"
          markerEnd="url(#slab-arrow)"
        />
        <text
          x="268"
          y="80"
          textAnchor="middle"
          fill="#475569"
          fontSize="11"
          fontWeight="600"
          transform="rotate(90 268 80)"
        >
          T = {fmt(thicknessM)}
        </text>
      </svg>
      <figcaption className="mt-1 text-center text-xs text-slate-500">
        Slab dimensions (schematic — not to scale)
      </figcaption>
    </figure>
  );
}
