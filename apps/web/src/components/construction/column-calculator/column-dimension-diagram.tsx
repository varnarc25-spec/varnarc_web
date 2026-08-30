'use client';

import { cn } from '@/components/construction/styles';

function fmtLen(m: number): string {
  if (m >= 1) return `${Number(m.toFixed(2))} m`;
  return `${Number((m * 1000).toFixed(0))} mm`;
}

/** Visual rectangular column B × D × H diagram. */
export function RectangularColumnDiagram({
  widthM,
  depthM,
  heightM,
  className,
}: {
  widthM: number;
  depthM: number;
  heightM: number;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-orange-50/60 to-white p-4',
        className,
      )}
      aria-label="Rectangular column dimension diagram"
    >
      <svg viewBox="0 0 260 200" className="mx-auto h-auto w-full max-w-sm" role="img">
        <title>
          Rectangular column {fmtLen(widthM)} × {fmtLen(depthM)} × {fmtLen(heightM)}
        </title>
        <defs>
          <marker
            id="col-rect-arrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
          </marker>
        </defs>
        {/* Column prism */}
        <path
          d="M90 40 L130 20 L170 40 L130 60 Z"
          fill="#0b1f3a"
          fillOpacity="0.12"
          stroke="#0b1f3a"
          strokeWidth="1.5"
        />
        <path
          d="M90 40 L90 150 L130 170 L130 60 Z"
          fill="#f97316"
          fillOpacity="0.35"
          stroke="#0b1f3a"
          strokeWidth="1.5"
        />
        <path
          d="M130 60 L170 40 L170 150 L130 170 Z"
          fill="#0b1f3a"
          fillOpacity="0.08"
          stroke="#0b1f3a"
          strokeWidth="1.5"
        />
        {/* Height */}
        <line
          x1="70"
          y1="40"
          x2="70"
          y2="150"
          stroke="#64748b"
          strokeWidth="1"
          markerEnd="url(#col-rect-arrow)"
        />
        <text
          x="52"
          y="100"
          textAnchor="middle"
          fill="#475569"
          fontSize="11"
          fontWeight="600"
          transform="rotate(-90 52 100)"
        >
          H = {fmtLen(heightM)}
        </text>
        {/* B */}
        <line
          x1="90"
          y1="185"
          x2="130"
          y2="185"
          stroke="#64748b"
          strokeWidth="1"
          markerEnd="url(#col-rect-arrow)"
        />
        <text x="110" y="198" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
          B = {fmtLen(widthM)}
        </text>
        {/* D */}
        <line
          x1="185"
          y1="150"
          x2="205"
          y2="40"
          stroke="#64748b"
          strokeWidth="1"
          markerEnd="url(#col-rect-arrow)"
        />
        <text x="220" y="100" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
          D = {fmtLen(depthM)}
        </text>
      </svg>
      <figcaption className="mt-1 text-center text-xs text-slate-500">
        Rectangular column B × D × H (schematic — not to scale)
      </figcaption>
    </figure>
  );
}

/** Visual circular column Ø × H diagram. */
export function CircularColumnDiagram({
  diameterM,
  heightM,
  className,
}: {
  diameterM: number;
  heightM: number;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-orange-50/60 to-white p-4',
        className,
      )}
      aria-label="Circular column dimension diagram"
    >
      <svg viewBox="0 0 260 200" className="mx-auto h-auto w-full max-w-sm" role="img">
        <title>
          Circular column Ø {fmtLen(diameterM)} × {fmtLen(heightM)}
        </title>
        <defs>
          <marker
            id="col-circ-arrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
          </marker>
          <linearGradient id="col-circ-side" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0b1f3a" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {/* Cylinder body */}
        <rect
          x="95"
          y="45"
          width="70"
          height="110"
          fill="url(#col-circ-side)"
          stroke="#0b1f3a"
          strokeWidth="1.5"
        />
        <ellipse
          cx="130"
          cy="45"
          rx="35"
          ry="14"
          fill="#0b1f3a"
          fillOpacity="0.12"
          stroke="#0b1f3a"
          strokeWidth="1.5"
        />
        <ellipse
          cx="130"
          cy="155"
          rx="35"
          ry="14"
          fill="#f97316"
          fillOpacity="0.35"
          stroke="#0b1f3a"
          strokeWidth="1.5"
        />
        {/* Height */}
        <line
          x1="70"
          y1="45"
          x2="70"
          y2="155"
          stroke="#64748b"
          strokeWidth="1"
          markerEnd="url(#col-circ-arrow)"
        />
        <text
          x="52"
          y="105"
          textAnchor="middle"
          fill="#475569"
          fontSize="11"
          fontWeight="600"
          transform="rotate(-90 52 105)"
        >
          H = {fmtLen(heightM)}
        </text>
        {/* Diameter */}
        <line
          x1="95"
          y1="178"
          x2="165"
          y2="178"
          stroke="#64748b"
          strokeWidth="1"
          markerEnd="url(#col-circ-arrow)"
        />
        <text x="130" y="194" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
          Ø = {fmtLen(diameterM)}
        </text>
      </svg>
      <figcaption className="mt-1 text-center text-xs text-slate-500">
        Circular column Ø × H (schematic — not to scale)
      </figcaption>
    </figure>
  );
}
