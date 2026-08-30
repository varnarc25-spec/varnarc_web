import { applyWastage } from '../construction-engine/wastage';
import { convertUnit } from '../construction-engine/units';
import { roundMoney, roundQuantity } from '../construction-engine/money';
import { buildReverseCalculationDisplay } from '../reverse-calculator';
import {
  DEFAULT_DOOR_HEIGHT_M,
  DEFAULT_DOOR_WIDTH_M,
  DEFAULT_PAINT_COVERAGE_M2_PER_L,
  DEFAULT_PAINT_PACKAGE_SIZES_L,
  DEFAULT_PRIMER_COVERAGE_M2_PER_L,
  DEFAULT_PUTTY_KG_PER_M2,
  DEFAULT_WINDOW_HEIGHT_M,
  DEFAULT_WINDOW_WIDTH_M,
  M2_TO_FT2,
  PAINT_CALC_VERSION,
} from './rates';
import {
  paintCalculatorInputSchema,
  type PaintCalculatorInput,
  type PaintCalculatorResult,
  type PaintPackagePlan,
  type PaintRoomBreakdown,
  type PaintRoomInput,
} from './types';

function requireConvert(value: number, from: string, to: string): number {
  const r = convertUnit(value, from, to);
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

function toM(value: number, unit: string): number {
  return requireConvert(value, unit, 'm');
}

function toM2(value: number, unit: string): number {
  return requireConvert(value, unit, 'm2');
}

function coverageToM2PerL(value: number, unit: 'm2_per_l' | 'ft2_per_l'): number {
  if (unit === 'ft2_per_l') return value / M2_TO_FT2;
  return value;
}

/**
 * Greedy pack plan: prefer larger tins, fill remainder with smaller sizes.
 * Always covers at least `neededLitres` (ceil remainder into smallest tin if needed).
 */
export function planPaintPackages(
  neededLitres: number,
  sizes: number[],
): { packages: PaintPackagePlan[]; purchaseLitres: number } {
  const sorted = [...new Set(sizes.filter((s) => s > 0))].sort((a, b) => b - a);
  if (!sorted.length) {
    throw new Error('At least one package size is required');
  }
  const counts = new Map<number, number>();
  let remaining = neededLitres;
  for (const size of sorted) {
    if (remaining <= 1e-9) break;
    const n = Math.floor(remaining / size + 1e-9);
    if (n > 0) {
      counts.set(size, n);
      remaining -= n * size;
    }
  }
  if (remaining > 1e-9) {
    const smallest = sorted[sorted.length - 1]!;
    counts.set(smallest, (counts.get(smallest) ?? 0) + 1);
  }
  const packages: PaintPackagePlan[] = sorted
    .filter((s) => (counts.get(s) ?? 0) > 0)
    .map((sizeLitres) => {
      const count = counts.get(sizeLitres)!;
      return {
        sizeLitres,
        count,
        totalLitres: roundQuantity(count * sizeLitres, 2),
      };
    });
  const purchaseLitres = roundQuantity(
    packages.reduce((sum, p) => sum + p.totalLitres, 0),
    2,
  );
  return { packages, purchaseLitres };
}

function openingDefaults(input: ReturnType<typeof paintCalculatorInputSchema.parse>) {
  const doorW =
    input.doorWidth != null ? toM(input.doorWidth, input.doorWidthUnit) : DEFAULT_DOOR_WIDTH_M;
  const doorH =
    input.doorHeight != null ? toM(input.doorHeight, input.doorHeightUnit) : DEFAULT_DOOR_HEIGHT_M;
  const winW =
    input.windowWidth != null
      ? toM(input.windowWidth, input.windowWidthUnit)
      : DEFAULT_WINDOW_WIDTH_M;
  const winH =
    input.windowHeight != null
      ? toM(input.windowHeight, input.windowHeightUnit)
      : DEFAULT_WINDOW_HEIGHT_M;
  return {
    doorArea: doorW * doorH,
    windowArea: winW * winH,
    doorW,
    doorH,
    winW,
    winH,
  };
}

function roomBreakdown(
  room: PaintRoomInput,
  index: number,
  doorArea: number,
  windowArea: number,
): PaintRoomBreakdown {
  const L = toM(room.length, room.lengthUnit);
  const W = toM(room.width, room.widthUnit);
  const H = toM(room.height, room.heightUnit);
  const wallGrossM2 = 2 * (L + W) * H;
  const openingM2 = room.doors * doorArea + room.windows * windowArea;
  const wallNetM2 = Math.max(0, wallGrossM2 - openingM2);
  const ceilingM2 = room.includeCeiling ? L * W : 0;
  return {
    id: room.id ?? `room-${index + 1}`,
    name: room.name ?? `Room ${index + 1}`,
    wallGrossM2: roundQuantity(wallGrossM2, 4),
    openingM2: roundQuantity(openingM2, 4),
    wallNetM2: roundQuantity(wallNetM2, 4),
    ceilingM2: roundQuantity(ceilingM2, 4),
    netPaintableM2: roundQuantity(wallNetM2 + ceilingM2, 4),
  };
}

function resolveForwardArea(
  input: ReturnType<typeof paintCalculatorInputSchema.parse>,
  steps: string[],
): {
  rooms: PaintRoomBreakdown[];
  wallNetM2: number;
  ceilingM2: number;
  openingM2: number;
  netPaintableM2: number;
} {
  const openings = openingDefaults(input);
  steps.push(
    `Door size assumption ${roundQuantity(openings.doorW, 3)} × ${roundQuantity(openings.doorH, 3)} m (${roundQuantity(openings.doorArea, 3)} m²); window ${roundQuantity(openings.winW, 3)} × ${roundQuantity(openings.winH, 3)} m (${roundQuantity(openings.windowArea, 3)} m²) — override if needed.`,
  );

  if (input.scope === 'direct_area') {
    const wallGross = toM2(input.wallArea!, input.wallAreaUnit);
    const ceiling =
      input.ceilingArea != null && input.ceilingArea > 0
        ? toM2(input.ceilingArea, input.ceilingAreaUnit)
        : 0;
    const doors = input.doors ?? 0;
    const windows = input.windows ?? 0;
    const openingM2 = doors * openings.doorArea + windows * openings.windowArea;
    const wallNetM2 = Math.max(0, wallGross - openingM2);
    const net = wallNetM2 + ceiling;
    steps.push(
      `Direct wall area ${roundQuantity(wallGross, 4)} m² − openings ${roundQuantity(openingM2, 4)} m² = ${roundQuantity(wallNetM2, 4)} m²; ceiling ${roundQuantity(ceiling, 4)} m²; net ${roundQuantity(net, 4)} m².`,
    );
    return {
      rooms: [],
      wallNetM2,
      ceilingM2: ceiling,
      openingM2,
      netPaintableM2: net,
    };
  }

  const roomList: PaintRoomInput[] =
    input.rooms != null && input.rooms.length > 0
      ? input.rooms
      : [
          {
            length: input.length!,
            width: input.width!,
            height: input.height!,
            lengthUnit: input.lengthUnit,
            widthUnit: input.widthUnit,
            heightUnit: input.heightUnit,
            doors: input.doors,
            windows: input.windows,
            includeCeiling: input.includeCeiling,
            name: input.scope === 'house' ? 'Whole house (single volume)' : 'Room 1',
          },
        ];

  const rooms = roomList.map((r, i) => roomBreakdown(r, i, openings.doorArea, openings.windowArea));
  const wallNetM2 = rooms.reduce((s, r) => s + r.wallNetM2, 0);
  const ceilingM2 = rooms.reduce((s, r) => s + r.ceilingM2, 0);
  const openingM2 = rooms.reduce((s, r) => s + r.openingM2, 0);
  const netPaintableM2 = wallNetM2 + ceilingM2;

  for (const r of rooms) {
    steps.push(
      `${r.name}: walls net ${r.wallNetM2} m² (openings ${r.openingM2} m²)${r.ceilingM2 > 0 ? `, ceiling ${r.ceilingM2} m²` : ''} → ${r.netPaintableM2} m².`,
    );
  }
  if (rooms.length > 1) {
    steps.push(
      `Total net paintable area = ${roundQuantity(netPaintableM2, 4)} m² across ${rooms.length} rooms.`,
    );
  }

  return { rooms, wallNetM2, ceilingM2, openingM2, netPaintableM2 };
}

/**
 * Paint / primer / putty quantity calculator.
 * Coverage defaults are indicative — always overridable to match manufacturer data sheets.
 */
export function calculatePaintQuantity(raw: PaintCalculatorInput): PaintCalculatorResult {
  const input = paintCalculatorInputSchema.parse(raw);
  const steps: string[] = [];

  const coverageM2PerLitre = coverageToM2PerL(input.coveragePerLitre, input.coverageUnit);
  const coverageWasOverridden =
    Math.abs(coverageM2PerLitre - DEFAULT_PAINT_COVERAGE_M2_PER_L) > 1e-6 ||
    input.coverageUnit === 'ft2_per_l';

  const primerCoverageM2PerLitre = coverageToM2PerL(
    input.primerCoveragePerLitre,
    input.primerCoverageUnit,
  );

  const paintSizes = input.packageSizesLitres?.length
    ? input.packageSizesLitres
    : [...DEFAULT_PAINT_PACKAGE_SIZES_L];
  const primerSizes = input.primerPackageSizesLitres?.length
    ? input.primerPackageSizesLitres
    : paintSizes;

  if (input.mode === 'reverse') {
    const litres = input.availableLitres!;
    const oneCoatArea = litres * coverageM2PerLitre;
    const areaWithCoats = oneCoatArea / input.coats;
    const waste = applyWastage(1, input.wastagePercent);
    if (!waste.ok) throw new Error(waste.error);
    // Wastage reduces coverable area: effective coverage / (1+w%)
    const netArea = areaWithCoats / (1 + input.wastagePercent / 100);

    steps.push(
      `Reverse: ${litres} L × ${roundQuantity(coverageM2PerLitre, 3)} m²/L = ${roundQuantity(oneCoatArea, 3)} m² one-coat equivalent.`,
    );
    steps.push(
      `Divide by ${input.coats} coat(s) → ${roundQuantity(areaWithCoats, 3)} m² before wastage.`,
    );
    steps.push(
      `Allow ${input.wastagePercent}% wastage → coverable net area ≈ ${roundQuantity(netArea, 3)} m² (${roundQuantity(netArea * M2_TO_FT2, 1)} ft²).`,
    );

    return {
      mode: 'reverse',
      scope: input.scope,
      netPaintableAreaM2: roundQuantity(netArea, 4),
      netPaintableAreaFt2: roundQuantity(netArea * M2_TO_FT2, 2),
      wallNetM2: roundQuantity(netArea, 4),
      ceilingM2: 0,
      openingM2: 0,
      coats: input.coats,
      coverageM2PerLitre: roundQuantity(coverageM2PerLitre, 4),
      coverageWasOverridden,
      paintLitresExact: roundQuantity(litres, 3),
      paintLitres: roundQuantity(litres, 3),
      primerLitresExact: null,
      primerLitres: null,
      puttyKgExact: null,
      puttyKg: null,
      paintPackages: [],
      paintPurchaseLitres: roundQuantity(litres, 3),
      primerPackages: null,
      primerPurchaseLitres: null,
      reverseAreaOneCoatM2: roundQuantity(oneCoatArea, 4),
      rooms: [],
      wastagePercent: input.wastagePercent,
      estimatedCostInr: null,
      formula:
        'A_net = (L × coverage_m²/L / coats) / (1 + wastage%) · coverage is manufacturer-overridable',
      steps,
      assumptions: [
        `Coverage ${roundQuantity(coverageM2PerLitre, 2)} m²/L per coat${coverageWasOverridden ? ' (user override)' : ` (default ${DEFAULT_PAINT_COVERAGE_M2_PER_L} m²/L)`}.`,
        `${input.coats} coat(s); wastage ${input.wastagePercent}% reduces coverable area.`,
        'Reverse mode answers “how much area can these litres cover?” — not a purchase plan.',
      ],
      limitations: [
        'Indicative coverage only — surface porosity, colour change and preparation change real litres.',
        'Does not certify that paint stock will finish a specific room without extra coats.',
      ],
      reverseDisplay: buildReverseCalculationDisplay({
        assumptions: [
          `Coverage ${roundQuantity(coverageM2PerLitre, 2)} m²/L per coat${coverageWasOverridden ? ' (user override)' : ` (default ${DEFAULT_PAINT_COVERAGE_M2_PER_L} m²/L)`}.`,
          `${input.coats} coat(s); wastage ${input.wastagePercent}% reduces coverable area.`,
          'Reverse mode answers “how much area can these litres cover?” — not a purchase plan.',
        ],
        selectedUnit: 'm² (also shown in ft²)',
        wastagePercent: input.wastagePercent,
        formula:
          'A_net = (L × coverage_m²/L / coats) / (1 + wastage%) · coverage is manufacturer-overridable',
        limitations: [
          'Indicative coverage only — surface porosity, colour change and preparation change real litres.',
          'Does not certify that paint stock will finish a specific room without extra coats.',
        ],
      }),
      disclaimer:
        'Indicative only. Surface condition and product data sheets change coverage. Confirm with a site measure.',
      version: PAINT_CALC_VERSION,
    };
  }

  // Forward
  const area = resolveForwardArea(input, steps);
  const coatArea = area.netPaintableM2 * input.coats;
  steps.push(
    `Coat-area = net ${roundQuantity(area.netPaintableM2, 4)} m² × ${input.coats} coats = ${roundQuantity(coatArea, 4)} m².`,
  );

  const paintBefore = coatArea / coverageM2PerLitre;
  const paintWaste = applyWastage(paintBefore, input.wastagePercent);
  if (!paintWaste.ok) throw new Error(paintWaste.error);
  const paintLitresExact = paintWaste.value;
  const paintLitres = roundQuantity(paintLitresExact, 3);
  steps.push(
    `Paint = ${roundQuantity(coatArea, 4)} / ${roundQuantity(coverageM2PerLitre, 3)} m²/L = ${roundQuantity(paintBefore, 3)} L before wastage → ${paintLitres} L after ${input.wastagePercent}%.`,
  );

  let primerLitresExact: number | null = null;
  let primerLitres: number | null = null;
  let primerPackages: PaintPackagePlan[] | null = null;
  let primerPurchaseLitres: number | null = null;

  if (input.includePrimer) {
    const primerBefore = (area.netPaintableM2 * input.primerCoats) / primerCoverageM2PerLitre;
    const primerWaste = applyWastage(primerBefore, input.wastagePercent);
    if (!primerWaste.ok) throw new Error(primerWaste.error);
    primerLitresExact = primerWaste.value;
    primerLitres = roundQuantity(primerLitresExact, 3);
    const plan = planPaintPackages(primerLitresExact, primerSizes);
    primerPackages = plan.packages;
    primerPurchaseLitres = plan.purchaseLitres;
    steps.push(
      `Primer (${input.primerCoats} coat(s) @ ${roundQuantity(primerCoverageM2PerLitre, 3)} m²/L) → ${primerLitres} L after wastage; buy ${primerPurchaseLitres} L in tins.`,
    );
  }

  let puttyKgExact: number | null = null;
  let puttyKg: number | null = null;
  if (input.includePutty) {
    const puttyBefore = area.netPaintableM2 * input.puttyKgPerM2;
    const puttyWaste = applyWastage(puttyBefore, input.wastagePercent);
    if (!puttyWaste.ok) throw new Error(puttyWaste.error);
    puttyKgExact = puttyWaste.value;
    puttyKg = roundQuantity(puttyKgExact, 2);
    steps.push(`Putty @ ${input.puttyKgPerM2} kg/m² → ${puttyKg} kg after wastage.`);
  }

  const paintPlan = planPaintPackages(paintLitresExact, paintSizes);
  steps.push(
    `Recommended paint purchase = ${paintPlan.purchaseLitres} L from packs [${paintSizes.join(', ')}] L.`,
  );

  let estimatedCostInr: number | null = null;
  let cost = 0;
  if (input.paintPricePerLitreInr != null && input.paintPricePerLitreInr > 0) {
    cost += paintPlan.purchaseLitres * input.paintPricePerLitreInr;
  }
  if (
    primerPurchaseLitres != null &&
    input.primerPricePerLitreInr != null &&
    input.primerPricePerLitreInr > 0
  ) {
    cost += primerPurchaseLitres * input.primerPricePerLitreInr;
  }
  if (puttyKg != null && input.puttyPricePerKgInr != null && input.puttyPricePerKgInr > 0) {
    cost += puttyKg * input.puttyPricePerKgInr;
  }
  if (cost > 0) {
    estimatedCostInr = roundMoney(cost);
    steps.push(`Estimated material cost ≈ ₹${estimatedCostInr} (indicative).`);
  }

  return {
    mode: 'forward',
    scope: input.scope,
    netPaintableAreaM2: roundQuantity(area.netPaintableM2, 4),
    netPaintableAreaFt2: roundQuantity(area.netPaintableM2 * M2_TO_FT2, 2),
    wallNetM2: roundQuantity(area.wallNetM2, 4),
    ceilingM2: roundQuantity(area.ceilingM2, 4),
    openingM2: roundQuantity(area.openingM2, 4),
    coats: input.coats,
    coverageM2PerLitre: roundQuantity(coverageM2PerLitre, 4),
    coverageWasOverridden,
    paintLitresExact: roundQuantity(paintLitresExact, 4),
    paintLitres,
    primerLitresExact: primerLitresExact != null ? roundQuantity(primerLitresExact, 4) : null,
    primerLitres,
    puttyKgExact: puttyKgExact != null ? roundQuantity(puttyKgExact, 4) : null,
    puttyKg,
    paintPackages: paintPlan.packages,
    paintPurchaseLitres: paintPlan.purchaseLitres,
    primerPackages,
    primerPurchaseLitres,
    reverseAreaOneCoatM2: null,
    rooms: area.rooms,
    wastagePercent: input.wastagePercent,
    estimatedCostInr,
    formula:
      'A_net = Σ(2(L+W)H − doors×A_d − windows×A_w) [+ ceiling] · paint_L = A_net × coats / coverage × (1+w%)',
    steps,
    assumptions: [
      `Coverage ${roundQuantity(coverageM2PerLitre, 2)} m²/L per coat${coverageWasOverridden ? ' (user/manufacturer override)' : ` (default ${DEFAULT_PAINT_COVERAGE_M2_PER_L} m²/L — override to match the tin)`}.`,
      `Door ${DEFAULT_DOOR_WIDTH_M}×${DEFAULT_DOOR_HEIGHT_M} m and window ${DEFAULT_WINDOW_WIDTH_M}×${DEFAULT_WINDOW_HEIGHT_M} m unless overridden.`,
      input.includePrimer
        ? `Primer included @ ${roundQuantity(primerCoverageM2PerLitre, 2)} m²/L, ${input.primerCoats} coat(s).`
        : 'Primer not included.',
      input.includePutty
        ? `Putty included @ ${input.puttyKgPerM2} kg/m² (default ${DEFAULT_PUTTY_KG_PER_M2}).`
        : 'Putty not included.',
      `Wastage ${input.wastagePercent}%. Package plan uses sizes [${paintSizes.join(', ')}] L.`,
      'Indicative only — confirm with site measurement and manufacturer data sheets.',
    ],
    limitations: [
      'Forward mode estimates litres to buy — not a finishing schedule guarantee.',
      'Surface porosity and colour change can alter real consumption.',
    ],
    reverseDisplay: null,
    disclaimer:
      'This paint estimate is educational only. It is not a finishing schedule or quote. Override coverage to match your brand’s stated m²/L.',
    version: PAINT_CALC_VERSION,
  };
}
