'use client';

import { cn } from '@/components/construction/styles';
import type { TileGridLayout, TileSurface } from '@varnarc/validation';

/** Visual tile grid — schematic preview of layout count (capped for readability). */
export function TileGridDiagram({
  grid,
  surface = 'floor',
  className,
}: {
  grid: TileGridLayout;
  surface?: TileSurface;
  className?: string;
}) {
  const cols = Math.max(1, grid.previewCols);
  const rows = Math.max(1, grid.previewRows);
  const cellW = 200 / cols;
  const cellH = 140 / rows;
  const grout = Math.min(1.2, Math.max(0.4, Math.min(cellW, cellH) * 0.08));
  const truncated = grid.tilesAlongLength > cols || grid.tilesAlongWidth > rows;

  const tiles: Array<{ x: number; y: number; w: number; h: number; key: string }> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({
        key: `${r}-${c}`,
        x: 20 + c * cellW + grout / 2,
        y: 12 + r * cellH + grout / 2,
        w: Math.max(0.5, cellW - grout),
        h: Math.max(0.5, cellH - grout),
      });
    }
  }

  return (
    <figure
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-orange-50/70 to-white p-4',
        className,
      )}
      aria-label={`${surface} tile layout preview`}
    >
      <svg viewBox="0 0 240 168" className="mx-auto h-auto w-full max-w-sm" role="img">
        <title>
          {grid.tilesAlongLength} × {grid.tilesAlongWidth} tile grid
        </title>
        <rect
          x="18"
          y="10"
          width="204"
          height="144"
          rx="2"
          fill="#0b1f3a"
          fillOpacity="0.06"
          stroke="#0b1f3a"
          strokeWidth="1.5"
        />
        {tiles.map((t) => (
          <rect
            key={t.key}
            x={t.x}
            y={t.y}
            width={t.w}
            height={t.h}
            rx="0.5"
            fill="#fff"
            stroke="#f97316"
            strokeWidth="0.6"
            strokeOpacity="0.85"
          />
        ))}
        <text x="120" y="164" textAnchor="middle" fill="#64748b" fontSize="9">
          {grid.tilesAlongLength} × {grid.tilesAlongWidth} tiles
          {truncated ? ' (preview capped)' : ''} · {surface}
        </text>
      </svg>
      <figcaption className="mt-1 text-center text-xs text-slate-500">
        Layout guide only — not to scale
        {truncated
          ? ` · showing ${cols}×${rows} of ${grid.tilesAlongLength}×${grid.tilesAlongWidth}`
          : ''}
      </figcaption>
    </figure>
  );
}
