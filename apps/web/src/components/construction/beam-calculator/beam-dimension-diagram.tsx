'use client';

import { cn } from '@/components/construction/styles';

/** Visual beam B × D × L diagram with dimension callouts. */
export function BeamDimensionDiagram({
  widthM,
  depthM,
  lengthM,
  className,
}: {
  widthM: number;
  depthM: number;
  lengthM: number;
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
      aria-label="Beam dimension diagram"
    >
      <svg viewBox="0 0 280 160" className="mx-auto h-auto w-full max-w-md" role="img">
        <title>
          Beam {fmt(widthM)} × {fmt(depthM)} × {fmt(lengthM)}
        </title>
        <defs>
          <marker id="beam-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
          </marker>
        </defs>
        {/* Beam prism */}
        <path
          d="M40 70 L60 40 L220 40 L200 70 Z"
          fill="#0b1f3a"
          fillOpacity="0.1"
          stroke="#0b1f3a"
          strokeWidth="2"
        />
        <path
          d="M40 70 L40 110 L200 110 L200 70 Z"
          fill="#f97316"
          fillOpacity="0.3"
          stroke="#0b1f3a"
          strokeWidth="1.5"
        />
        <path
          d="M200 70 L220 40 L220 80 L200 110 Z"
          fill="#0b1f3a"
          fillOpacity="0.08"
          stroke="#0b1f3a"
          strokeWidth="1.5"
        />
        {/* Length */}
        <line
          x1="40"
          y1="128"
          x2="200"
          y2="128"
          stroke="#64748b"
          strokeWidth="1"
          markerEnd="url(#beam-arrow)"
        />
        <text x="120" y="144" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
          L = {fmt(lengthM)}
        </text>
        {/* Depth */}
        <line
          x1="28"
          y1="70"
          x2="28"
          y2="110"
          stroke="#64748b"
          strokeWidth="1"
          markerEnd="url(#beam-arrow)"
        />
        <text
          x="14"
          y="92"
          textAnchor="middle"
          fill="#475569"
          fontSize="11"
          fontWeight="600"
          transform="rotate(-90 14 92)"
        >
          D = {fmt(depthM)}
        </text>
        {/* Width */}
        <line
          x1="200"
          y1="30"
          x2="220"
          y2="30"
          stroke="#64748b"
          strokeWidth="1"
          markerEnd="url(#beam-arrow)"
        />
        <text x="210" y="24" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
          B = {fmt(widthM)}
        </text>
      </svg>
      <figcaption className="mt-1 text-center text-xs text-slate-500">
        Beam B × D × L (schematic — not to scale)
      </figcaption>
    </figure>
  );
}
