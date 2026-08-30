'use client';

import { cn } from '@/components/construction/styles';

function fmtLen(m: number): string {
  if (m >= 1) return `${Number(m.toFixed(2))} m`;
  return `${Number((m * 1000).toFixed(0))} mm`;
}

/** Visual footing L × W × D diagram with optional PCC bed. */
export function FootingDimensionDiagram({
  lengthM,
  widthM,
  depthM,
  pccThicknessM,
  shape,
  className,
}: {
  lengthM: number;
  widthM: number;
  depthM: number;
  pccThicknessM?: number | null;
  shape: 'rectangular' | 'square';
  className?: string;
}) {
  const showPcc = pccThicknessM != null && pccThicknessM > 0;

  return (
    <figure
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-orange-50/60 to-white p-4',
        className,
      )}
      aria-label="Footing dimension diagram"
    >
      <svg viewBox="0 0 300 210" className="mx-auto h-auto w-full max-w-md" role="img">
        <title>
          {shape === 'square' ? 'Square' : 'Rectangular'} footing {fmtLen(lengthM)} ×{' '}
          {fmtLen(widthM)} × {fmtLen(depthM)}
          {showPcc ? ` with PCC ${fmtLen(pccThicknessM!)}` : ''}
        </title>
        <defs>
          <marker id="ft-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
          </marker>
        </defs>

        {/* PCC bed (below) */}
        {showPcc ? (
          <>
            <path
              d="M55 148 L130 108 L245 108 L170 148 Z"
              fill="#94a3b8"
              fillOpacity="0.35"
              stroke="#64748b"
              strokeWidth="1.2"
            />
            <path
              d="M55 148 L55 162 L170 162 L170 148 Z"
              fill="#64748b"
              fillOpacity="0.25"
              stroke="#475569"
              strokeWidth="1.2"
            />
            <path
              d="M170 148 L245 108 L245 122 L170 162 Z"
              fill="#94a3b8"
              fillOpacity="0.2"
              stroke="#64748b"
              strokeWidth="1.2"
            />
            <text x="210" y="175" fill="#475569" fontSize="10" fontWeight="600">
              PCC t = {fmtLen(pccThicknessM!)}
            </text>
          </>
        ) : null}

        {/* RCC footing */}
        <path
          d="M60 100 L135 55 L250 55 L175 100 Z"
          fill="#0b1f3a"
          fillOpacity="0.12"
          stroke="#0b1f3a"
          strokeWidth="1.8"
        />
        <path
          d="M60 100 L60 128 L175 128 L175 100 Z"
          fill="#f97316"
          fillOpacity="0.4"
          stroke="#0b1f3a"
          strokeWidth="1.5"
        />
        <path
          d="M175 100 L250 55 L250 83 L175 128 Z"
          fill="#0b1f3a"
          fillOpacity="0.08"
          stroke="#0b1f3a"
          strokeWidth="1.5"
        />

        {/* Length */}
        <line
          x1="60"
          y1={showPcc ? 185 : 150}
          x2="175"
          y2={showPcc ? 185 : 150}
          stroke="#64748b"
          strokeWidth="1"
          markerEnd="url(#ft-arrow)"
        />
        <text
          x="117"
          y={showPcc ? 200 : 165}
          textAnchor="middle"
          fill="#475569"
          fontSize="11"
          fontWeight="600"
        >
          L = {fmtLen(lengthM)}
        </text>

        {/* Width */}
        <line
          x1="185"
          y1="42"
          x2="255"
          y2="42"
          stroke="#64748b"
          strokeWidth="1"
          markerEnd="url(#ft-arrow)"
        />
        <text x="220" y="34" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
          {shape === 'square' ? 'W = L' : `W = ${fmtLen(widthM)}`}
        </text>

        {/* Depth */}
        <line
          x1="45"
          y1="100"
          x2="45"
          y2="128"
          stroke="#64748b"
          strokeWidth="1"
          markerEnd="url(#ft-arrow)"
        />
        <text
          x="28"
          y="118"
          textAnchor="middle"
          fill="#475569"
          fontSize="11"
          fontWeight="600"
          transform="rotate(-90 28 118)"
        >
          D = {fmtLen(depthM)}
        </text>
      </svg>
      <figcaption className="mt-1 text-center text-xs text-slate-500">
        {shape === 'square' ? 'Square' : 'Rectangular'} footing L × W × D
        {showPcc ? ' with PCC bed' : ''} (schematic — not to scale)
      </figcaption>
    </figure>
  );
}
