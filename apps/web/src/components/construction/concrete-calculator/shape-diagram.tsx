'use client';

import type { ConcreteShape } from '@varnarc/validation';
import { cn } from '@/components/construction/styles';

/** Simple SVG diagrams that adapt to the selected concrete shape. */
export function ConcreteShapeDiagram({
  shape,
  className,
}: {
  shape: ConcreteShape;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4',
        className,
      )}
      aria-label={`${shape.replace(/_/g, ' ')} diagram`}
    >
      <svg viewBox="0 0 240 140" className="mx-auto h-auto w-full max-w-xs" role="img">
        <title>Shape diagram</title>
        {shape === 'slab' ? <SlabDiagram /> : null}
        {shape === 'rectangular_footing' ? <FootingDiagram /> : null}
        {shape === 'column' || shape === 'custom_rectangular' ? <BoxDiagram /> : null}
        {shape === 'wall' ? <WallDiagram /> : null}
        {shape === 'circular_column' ? <CylinderDiagram /> : null}
      </svg>
      <figcaption className="mt-2 text-center text-xs font-medium text-slate-500">
        {shape.replace(/_/g, ' ')}
      </figcaption>
    </figure>
  );
}

function dim(x1: number, y1: number, x2: number, y2: number, label: string) {
  return (
    <g stroke="#64748b" strokeWidth="1" fill="#64748b" fontSize="10">
      <line x1={x1} y1={y1} x2={x2} y2={y2} markerEnd="url(#arrow)" />
      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4} textAnchor="middle" fill="#475569">
        {label}
      </text>
    </g>
  );
}

function SlabDiagram() {
  return (
    <g>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
        </marker>
      </defs>
      <path
        d="M40 90 L100 55 L200 55 L140 90 Z"
        fill="#0b1f3a"
        fillOpacity="0.12"
        stroke="#0b1f3a"
        strokeWidth="2"
      />
      <path
        d="M40 90 L40 100 L140 100 L140 90"
        fill="#f97316"
        fillOpacity="0.25"
        stroke="#0b1f3a"
        strokeWidth="1.5"
      />
      <path
        d="M140 90 L200 55 L200 65 L140 100 Z"
        fill="#0b1f3a"
        fillOpacity="0.08"
        stroke="#0b1f3a"
      />
      {dim(40, 112, 140, 112, 'L')}
      {dim(210, 55, 210, 100, 'T')}
      {dim(155, 40, 205, 40, 'W')}
    </g>
  );
}

function FootingDiagram() {
  return (
    <g>
      <rect
        x="60"
        y="70"
        width="120"
        height="40"
        rx="2"
        fill="#0b1f3a"
        fillOpacity="0.12"
        stroke="#0b1f3a"
        strokeWidth="2"
      />
      <rect
        x="95"
        y="35"
        width="50"
        height="35"
        fill="#f97316"
        fillOpacity="0.2"
        stroke="#0b1f3a"
        strokeWidth="1.5"
      />
      <text x="120" y="128" textAnchor="middle" fill="#475569" fontSize="10">
        L × W × D
      </text>
    </g>
  );
}

function BoxDiagram() {
  return (
    <g>
      <path
        d="M70 110 L70 45 L120 25 L170 45 L170 110 L120 130 Z"
        fill="#0b1f3a"
        fillOpacity="0.1"
        stroke="#0b1f3a"
        strokeWidth="2"
      />
      <path d="M70 45 L120 65 L170 45" fill="none" stroke="#0b1f3a" strokeWidth="1.5" />
      <path d="M120 65 L120 130" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="120" y="20" textAnchor="middle" fill="#475569" fontSize="10">
        L × W × H
      </text>
    </g>
  );
}

function WallDiagram() {
  return (
    <g>
      <rect
        x="55"
        y="30"
        width="130"
        height="80"
        fill="#0b1f3a"
        fillOpacity="0.1"
        stroke="#0b1f3a"
        strokeWidth="2"
      />
      <rect
        x="55"
        y="30"
        width="18"
        height="80"
        fill="#f97316"
        fillOpacity="0.35"
        stroke="#0b1f3a"
      />
      <text x="120" y="128" textAnchor="middle" fill="#475569" fontSize="10">
        L × H × T
      </text>
    </g>
  );
}

function CylinderDiagram() {
  return (
    <g>
      <ellipse
        cx="120"
        cy="35"
        rx="40"
        ry="14"
        fill="#0b1f3a"
        fillOpacity="0.12"
        stroke="#0b1f3a"
        strokeWidth="2"
      />
      <path
        d="M80 35 L80 105 Q120 125 160 105 L160 35"
        fill="#0b1f3a"
        fillOpacity="0.08"
        stroke="#0b1f3a"
        strokeWidth="2"
      />
      <ellipse
        cx="120"
        cy="105"
        rx="40"
        ry="14"
        fill="#f97316"
        fillOpacity="0.2"
        stroke="#0b1f3a"
        strokeWidth="2"
      />
      <text x="120" y="132" textAnchor="middle" fill="#475569" fontSize="10">
        π × r² × H
      </text>
    </g>
  );
}
