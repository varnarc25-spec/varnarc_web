import { convertUnit } from '../construction-engine/units';
import { roundMoney, roundQuantity } from '../construction-engine/money';
import { buildReverseCalculationDisplay } from '../reverse-calculator';
import type { ReverseCalculationDisplay } from '../reverse-calculator';
import { M2_TO_FT2, TILE_CALC_VERSION, TILE_GRID_PREVIEW_MAX } from './rates';
import {
  tileCalculatorInputSchema,
  type TileCalculatorInput,
  type TileCalculatorResult,
  type TileGridLayout,
} from './types';

function requireConvert(value: number, from: string, to: string): number {
  const r = convertUnit(value, from, to);
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

function toM(value: number, unit: string): number {
  return requireConvert(value, unit, 'm');
}

function buildGrid(
  roomLengthM: number,
  roomWidthM: number,
  pitchLengthM: number,
  pitchWidthM: number,
): TileGridLayout {
  const tilesAlongLength = Math.max(1, Math.ceil(roomLengthM / pitchLengthM - 1e-9));
  const tilesAlongWidth = Math.max(1, Math.ceil(roomWidthM / pitchWidthM - 1e-9));
  return {
    tilesAlongLength,
    tilesAlongWidth,
    previewCols: Math.min(TILE_GRID_PREVIEW_MAX, tilesAlongLength),
    previewRows: Math.min(TILE_GRID_PREVIEW_MAX, tilesAlongWidth),
    pitchLengthM: roundQuantity(pitchLengthM, 6),
    pitchWidthM: roundQuantity(pitchWidthM, 6),
  };
}

/**
 * Floor / wall tile quantity with optional grout pitch and reverse coverage mode.
 */
export function calculateTileQuantity(raw: TileCalculatorInput): TileCalculatorResult {
  const input = tileCalculatorInputSchema.parse(raw);
  const steps: string[] = [];
  const surfaceLabel = input.surface === 'wall' ? 'wall' : 'floor';

  const tileLengthM = toM(input.tileLength!, input.tileLengthUnit);
  const tileWidthM = toM(input.tileWidth!, input.tileWidthUnit);
  const tileAreaM2 = tileLengthM * tileWidthM;
  const tileAreaCm2 = tileAreaM2 * 10_000;

  const groutWidthM =
    input.groutWidth != null && input.groutWidth > 0
      ? toM(input.groutWidth, input.groutWidthUnit)
      : 0;
  const pitchLengthM = tileLengthM + groutWidthM;
  const pitchWidthM = tileWidthM + groutWidthM;

  steps.push(
    `Tile size = ${roundQuantity(tileLengthM * 1000, 1)} × ${roundQuantity(tileWidthM * 1000, 1)} mm → area ${roundQuantity(tileAreaM2, 6)} m² (${roundQuantity(tileAreaCm2, 2)} cm²).`,
  );
  if (groutWidthM > 0) {
    steps.push(
      `Grout ${roundQuantity(groutWidthM * 1000, 2)} mm → layout pitch ${roundQuantity(pitchLengthM * 1000, 1)} × ${roundQuantity(pitchWidthM * 1000, 1)} mm.`,
    );
  } else {
    steps.push('No grout width applied (tiles butted for layout count).');
  }

  if (input.mode === 'reverse') {
    const tiles = input.availableTiles!;
    const effectiveTiles = tiles / (1 + input.wastagePercent / 100);
    // Coverable area uses solid tile face area (grout is joint, not covering surface product)
    const coverableAreaM2 = effectiveTiles * tileAreaM2;
    steps.push(
      `Reverse: ${tiles} tiles ÷ (1 + ${input.wastagePercent}% wastage) = ${roundQuantity(effectiveTiles, 2)} effective tiles.`,
    );
    steps.push(
      `Coverable ${surfaceLabel} area ≈ ${roundQuantity(effectiveTiles, 2)} × ${roundQuantity(tileAreaM2, 6)} = ${roundQuantity(coverableAreaM2, 4)} m² (${roundQuantity(coverableAreaM2 * M2_TO_FT2, 2)} ft²).`,
    );

    return {
      mode: 'reverse',
      surface: input.surface,
      surfaceAreaM2: roundQuantity(coverableAreaM2, 4),
      surfaceAreaFt2: roundQuantity(coverableAreaM2 * M2_TO_FT2, 2),
      tileAreaM2: roundQuantity(tileAreaM2, 6),
      tileAreaCm2: roundQuantity(tileAreaCm2, 2),
      roomLengthM: null,
      roomWidthM: null,
      tileLengthM: roundQuantity(tileLengthM, 6),
      tileWidthM: roundQuantity(tileWidthM, 6),
      groutWidthM: roundQuantity(groutWidthM, 6),
      numberOfRooms: 1,
      baseTiles: Math.floor(effectiveTiles),
      wastageTiles: Math.max(0, Math.ceil(tiles - effectiveTiles - 1e-9)),
      totalTiles: Math.ceil(tiles - 1e-9),
      tilesPerBox: input.tilesPerBox ?? null,
      boxesNeeded:
        input.tilesPerBox != null && input.tilesPerBox > 0
          ? Math.ceil(tiles / input.tilesPerBox - 1e-9)
          : null,
      grid: null,
      coverableAreaM2: roundQuantity(coverableAreaM2, 4),
      coverableAreaFt2: roundQuantity(coverableAreaM2 * M2_TO_FT2, 2),
      wastagePercent: input.wastagePercent,
      estimatedCostInr: null,
      formula: 'A_cover = (tiles / (1 + wastage%)) × tile_L × tile_W',
      steps,
      assumptions: [
        `Tile ${roundQuantity(tileLengthM * 1000, 1)} × ${roundQuantity(tileWidthM * 1000, 1)} mm.`,
        `Wastage ${input.wastagePercent}% reduces coverable area (cuts, breakage, pattern matching).`,
        'Reverse mode answers “how much area can these tiles cover?” — not a purchase plan.',
      ],
      limitations: [
        'Indicative coverage only — pattern layout, edge cuts and substrate change real area.',
        'Does not certify that tiles will finish a specific room without additional stock.',
        'Always confirm with a site measure before ordering or laying.',
      ],
      reverseDisplay: buildReverseCalculationDisplay({
        assumptions: [
          `Tile ${roundQuantity(tileLengthM * 1000, 1)} × ${roundQuantity(tileWidthM * 1000, 1)} mm.`,
          `Wastage ${input.wastagePercent}% reduces coverable area (cuts, breakage, pattern matching).`,
          'Reverse mode answers “how much area can these tiles cover?” — not a purchase plan.',
        ],
        selectedUnit: 'm² (also shown in ft²)',
        wastagePercent: input.wastagePercent,
        formula: 'A_cover = (tiles / (1 + wastage%)) × tile_L × tile_W',
        limitations: [
          'Indicative coverage only — pattern layout, edge cuts and substrate change real area.',
          'Does not certify that tiles will finish a specific room without additional stock.',
          'Always confirm with a site measure before ordering or laying.',
        ],
      }),
      disclaimer:
        'Indicative only. Pattern layout, cuts at edges and substrate condition change real coverage. Confirm with a site measure.',
      version: TILE_CALC_VERSION,
    };
  }

  // Forward
  const roomLengthM = toM(input.roomLength!, input.roomLengthUnit);
  const roomWidthM = toM(input.roomWidth!, input.roomWidthUnit);
  const rooms = input.numberOfRooms;
  const surfaceAreaOne = roomLengthM * roomWidthM;
  const surfaceAreaM2 = surfaceAreaOne * rooms;

  const dimLabel =
    input.surface === 'wall'
      ? `Wall ${roundQuantity(roomLengthM, 3)} × ${roundQuantity(roomWidthM, 3)} m (length × height)`
      : `Room ${roundQuantity(roomLengthM, 3)} × ${roundQuantity(roomWidthM, 3)} m`;

  steps.push(
    `${dimLabel} → ${roundQuantity(surfaceAreaOne, 4)} m² per ${input.surface === 'wall' ? 'wall' : 'room'}.`,
  );
  if (rooms > 1) {
    steps.push(
      `${rooms} ${input.surface === 'wall' ? 'walls/rooms' : 'rooms'} → total ${surfaceLabel} area ${roundQuantity(surfaceAreaM2, 4)} m².`,
    );
  }

  const grid = buildGrid(roomLengthM, roomWidthM, pitchLengthM, pitchWidthM);
  const basePerRoom = grid.tilesAlongLength * grid.tilesAlongWidth;
  const baseTiles = basePerRoom * rooms;
  const wastageTiles = Math.ceil((baseTiles * input.wastagePercent) / 100 - 1e-9);
  const totalTiles = baseTiles + wastageTiles;

  steps.push(
    `Grid per surface: ceil(${roundQuantity(roomLengthM, 3)} / ${roundQuantity(pitchLengthM, 4)}) × ceil(${roundQuantity(roomWidthM, 3)} / ${roundQuantity(pitchWidthM, 4)}) = ${grid.tilesAlongLength} × ${grid.tilesAlongWidth} = ${basePerRoom} tiles.`,
  );
  steps.push(
    `Base tiles = ${basePerRoom} × ${rooms} = ${baseTiles}; wastage ${input.wastagePercent}% → +${wastageTiles}; total to purchase = ${totalTiles}.`,
  );

  // Area cross-check
  const areaBased = Math.ceil(surfaceAreaM2 / tileAreaM2 - 1e-9);
  steps.push(
    `Area cross-check (no grout pitch): ceil(${roundQuantity(surfaceAreaM2, 4)} / ${roundQuantity(tileAreaM2, 6)}) = ${areaBased} tiles before wastage.`,
  );

  let boxesNeeded: number | null = null;
  if (input.tilesPerBox != null && input.tilesPerBox > 0) {
    boxesNeeded = Math.ceil(totalTiles / input.tilesPerBox - 1e-9);
    steps.push(`Boxes = ceil(${totalTiles} / ${input.tilesPerBox}) = ${boxesNeeded}.`);
  }

  let estimatedCostInr: number | null = null;
  let cost = 0;
  if (input.pricePerBoxInr != null && input.pricePerBoxInr > 0 && boxesNeeded != null) {
    cost += boxesNeeded * input.pricePerBoxInr;
  } else if (input.pricePerTileInr != null && input.pricePerTileInr > 0) {
    cost += totalTiles * input.pricePerTileInr;
  }
  if (cost > 0) {
    estimatedCostInr = roundMoney(cost);
    steps.push(`Estimated cost ≈ ₹${estimatedCostInr} (indicative).`);
  }

  return {
    mode: 'forward',
    surface: input.surface,
    surfaceAreaM2: roundQuantity(surfaceAreaM2, 4),
    surfaceAreaFt2: roundQuantity(surfaceAreaM2 * M2_TO_FT2, 2),
    tileAreaM2: roundQuantity(tileAreaM2, 6),
    tileAreaCm2: roundQuantity(tileAreaCm2, 2),
    roomLengthM: roundQuantity(roomLengthM, 4),
    roomWidthM: roundQuantity(roomWidthM, 4),
    tileLengthM: roundQuantity(tileLengthM, 6),
    tileWidthM: roundQuantity(tileWidthM, 6),
    groutWidthM: roundQuantity(groutWidthM, 6),
    numberOfRooms: rooms,
    baseTiles,
    wastageTiles,
    totalTiles,
    tilesPerBox: input.tilesPerBox ?? null,
    boxesNeeded,
    grid,
    coverableAreaM2: null,
    coverableAreaFt2: null,
    wastagePercent: input.wastagePercent,
    estimatedCostInr,
    formula:
      'tiles = ceil(L / (tile_L + grout)) × ceil(W / (tile_W + grout)) × rooms · total = base + ceil(base × wastage%)',
    steps,
    assumptions: [
      `${input.surface === 'wall' ? 'Wall' : 'Floor'} tiling using a rectangular grid layout.`,
      groutWidthM > 0
        ? `Grout joint ${roundQuantity(groutWidthM * 1000, 2)} mm included in tile pitch.`
        : 'Grout width not set — layout uses tile face size only.',
      `Wastage ${input.wastagePercent}% added as whole tiles for cuts and breakage.`,
      'Grid preview may cap at 24 tiles per side — full counts are in the numbers.',
      'Indicative only — confirm skirting, niches and pattern matching on site.',
    ],
    limitations: [
      'Forward mode estimates tiles to purchase — not a laying schedule guarantee.',
      'Pattern layouts and cuts can change the purchase quantity.',
    ],
    reverseDisplay: null,
    disclaimer:
      'This tile estimate is educational only. It is not a flooring quote. Pattern layouts and cuts can change the purchase quantity.',
    version: TILE_CALC_VERSION,
  };
}
