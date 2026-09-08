import { z } from 'zod';
import { roundQuantity } from '../construction-engine/money';
import { toM } from '../masonry-wall/geometry';

export const ADVANCED_CALC_VERSION = '2026.09.1';

export const ADVANCED_PLANNING_DISCLAIMER =
  'Indicative planning quantities only. Confirm materials, dimensions and specifications with drawings, suppliers and qualified professionals.';

export const STRUCTURAL_PLANNING_DISCLAIMER =
  'Planning and geometry only. This is not structural design. Stair dimensions, loads, reinforcement and code compliance must be verified by a qualified structural engineer.';

export const lengthUnitSchema = z.enum(['mm', 'cm', 'm', 'ft', 'inch']);

export const ADVANCED_CONSTRUCTION_CALCULATORS = [
  {
    id: 'false-ceiling',
    href: '/construction/false-ceiling-calculator',
    alias: '/construction/calculators/false-ceiling',
    name: 'False Ceiling Calculator',
    purpose: 'Calculate gypsum/POP ceiling material and area.',
    icon: 'ceiling',
  },
  {
    id: 'staircase',
    href: '/construction/staircase-calculator',
    alias: '/construction/calculators/staircase',
    name: 'Staircase Calculator',
    purpose: 'Estimate staircase geometry and basic quantities.',
    icon: 'stairs',
  },
  {
    id: 'water-tank',
    href: '/construction/water-tank-calculator',
    alias: '/construction/calculators/water-tank',
    name: 'Water Tank Calculator',
    purpose: 'Calculate tank capacity from dimensions.',
    icon: 'tank',
  },
  {
    id: 'roofing',
    href: '/construction/roofing-calculator',
    alias: '/construction/calculators/roofing',
    name: 'Roofing Calculator',
    purpose: 'Estimate roof area and roofing materials.',
    icon: 'roof',
  },
  {
    id: 'aac-block',
    href: '/construction/aac-block-calculator',
    alias: '/construction/calculators/aac-block',
    name: 'AAC Block Calculator',
    purpose: 'Calculate block quantity and indicative mortar.',
    icon: 'block',
  },
  {
    id: 'wall-area',
    href: '/construction/wall-area-calculator',
    alias: '/construction/calculators/wall-area',
    name: 'Wall Area Calculator',
    purpose: 'Calculate paint/tile/plaster surface area.',
    icon: 'wall',
  },
  {
    id: 'excavation',
    href: '/construction/excavation-calculator',
    alias: '/construction/calculators/excavation',
    name: 'Excavation Calculator',
    purpose: 'Estimate excavation volume.',
    icon: 'excavate',
  },
] as const;

export type AdvancedConstructionCalculatorId =
  (typeof ADVANCED_CONSTRUCTION_CALCULATORS)[number]['id'];

function m(value: number, unit: z.infer<typeof lengthUnitSchema>): number {
  return toM(value, unit);
}

export const falseCeilingInputSchema = z.object({
  length: z.number().positive().max(500),
  width: z.number().positive().max(500),
  lengthUnit: lengthUnitSchema.default('m'),
  widthUnit: lengthUnitSchema.default('m'),
  openingAreaM2: z.number().min(0).max(50_000).default(0),
  wastagePercent: z.number().min(0).max(25).default(8),
  boardLengthM: z.number().positive().max(5).default(2.44),
  boardWidthM: z.number().positive().max(5).default(1.22),
});

export function calculateFalseCeiling(raw: z.input<typeof falseCeilingInputSchema>) {
  const input = falseCeilingInputSchema.parse(raw);
  const length = m(input.length, input.lengthUnit);
  const width = m(input.width, input.widthUnit);
  const gross = roundQuantity(length * width, 3);
  const net = roundQuantity(Math.max(0, gross - input.openingAreaM2), 3);
  const boardArea = input.boardLengthM * input.boardWidthM;
  const withWaste = net * (1 + input.wastagePercent / 100);
  const boards = Math.ceil(withWaste / boardArea - 1e-9);
  const perimeter = roundQuantity(2 * (length + width), 2);
  return {
    grossAreaM2: gross,
    netAreaM2: net,
    boardsRequired: boards,
    perimeterM: perimeter,
    boardAreaM2: roundQuantity(boardArea, 3),
    formula: 'net area = L × W − openings; boards = ceil(net × (1 + wastage) / board area)',
    assumptions: [
      `Room ${length.toFixed(2)} m × ${width.toFixed(2)} m.`,
      `Board size ${input.boardLengthM} × ${input.boardWidthM} m with ${input.wastagePercent}% wastage.`,
      'Channel/perimeter lengths are planning allowances, not a hanging system design.',
    ],
    disclaimer: ADVANCED_PLANNING_DISCLAIMER,
    version: ADVANCED_CALC_VERSION,
  };
}

export const staircaseInputSchema = z.object({
  floorHeight: z.number().positive().max(500),
  riserHeight: z.number().positive().max(500).default(0.175),
  treadDepth: z.number().positive().max(500).default(0.28),
  stairWidth: z.number().positive().max(500).default(1.0),
  waistThickness: z.number().positive().max(500).default(0.15),
  dimensionUnit: lengthUnitSchema.default('m'),
});

export function calculateStaircase(raw: z.input<typeof staircaseInputSchema>) {
  const input = staircaseInputSchema.parse(raw);
  const H = m(input.floorHeight, input.dimensionUnit);
  const r = m(input.riserHeight, input.dimensionUnit);
  const t = m(input.treadDepth, input.dimensionUnit);
  const w = m(input.stairWidth, input.dimensionUnit);
  const waist = m(input.waistThickness, input.dimensionUnit);
  const risers = Math.max(1, Math.round(H / r));
  const actualRiser = roundQuantity(H / risers, 4);
  const treads = Math.max(1, risers - 1);
  const going = roundQuantity(treads * t, 3);
  const volume = roundQuantity(w * going * waist, 3);
  return {
    risers,
    treads,
    actualRiserM: actualRiser,
    goingM: going,
    widthM: roundQuantity(w, 3),
    indicativeWaistVolumeM3: volume,
    formula:
      'risers ≈ round(floor height / riser); going = (risers − 1) × tread; volume ≈ width × going × waist',
    assumptions: [
      `Straight-flight planning geometry for ${H.toFixed(2)} m floor-to-floor.`,
      'Waist volume is a rectangular planning envelope — not a folded-slab take-off.',
    ],
    disclaimer: STRUCTURAL_PLANNING_DISCLAIMER,
    version: ADVANCED_CALC_VERSION,
  };
}

export const waterTankInputSchema = z.object({
  shape: z.enum(['rectangular', 'circular']).default('rectangular'),
  length: z.number().positive().max(50).optional(),
  width: z.number().positive().max(50).optional(),
  height: z.number().positive().max(20),
  diameter: z.number().positive().max(50).optional(),
  dimensionUnit: lengthUnitSchema.default('m'),
  freeboardPercent: z.number().min(0).max(20).default(0),
});

export function calculateWaterTank(raw: z.input<typeof waterTankInputSchema>) {
  const input = waterTankInputSchema.parse(raw);
  const h = m(input.height, input.dimensionUnit);
  let volumeM3 = 0;
  if (input.shape === 'circular') {
    const d = m(input.diameter ?? 0, input.dimensionUnit);
    if (!(d > 0)) throw new Error('Enter a tank diameter.');
    volumeM3 = Math.PI * (d / 2) ** 2 * h;
  } else {
    const l = m(input.length ?? 0, input.dimensionUnit);
    const w = m(input.width ?? 0, input.dimensionUnit);
    if (!(l > 0 && w > 0)) throw new Error('Enter tank length and width.');
    volumeM3 = l * w * h;
  }
  volumeM3 = roundQuantity(volumeM3, 4);
  const usable = roundQuantity(volumeM3 * (1 - input.freeboardPercent / 100), 4);
  const litres = roundQuantity(usable * 1000, 1);
  return {
    shape: input.shape,
    volumeM3,
    usableVolumeM3: usable,
    capacityLitres: litres,
    formula:
      input.shape === 'circular'
        ? 'volume = π × r² × H; litres = usable m³ × 1000'
        : 'volume = L × W × H; litres = usable m³ × 1000',
    assumptions: [
      input.freeboardPercent > 0
        ? `${input.freeboardPercent}% freeboard deducted from geometric volume.`
        : 'No freeboard deducted — geometric volume shown.',
      'Does not size walls, reinforcement or hydrostatic design.',
    ],
    disclaimer: ADVANCED_PLANNING_DISCLAIMER,
    version: ADVANCED_CALC_VERSION,
  };
}

export const roofingInputSchema = z.object({
  planLength: z.number().positive().max(500),
  planWidth: z.number().positive().max(500),
  dimensionUnit: lengthUnitSchema.default('m'),
  pitchDegrees: z.number().min(0).max(60).default(15),
  wastagePercent: z.number().min(0).max(25).default(10),
  sheetLengthM: z.number().positive().max(12).default(3.0),
  sheetWidthM: z.number().positive().max(3).default(1.0),
  overlapPercent: z.number().min(0).max(40).default(12),
});

export function calculateRoofing(raw: z.input<typeof roofingInputSchema>) {
  const input = roofingInputSchema.parse(raw);
  const L = m(input.planLength, input.dimensionUnit);
  const W = m(input.planWidth, input.dimensionUnit);
  const plan = roundQuantity(L * W, 3);
  const slope = 1 / Math.cos((input.pitchDegrees * Math.PI) / 180);
  const roof = roundQuantity(plan * slope, 3);
  const usableSheet = input.sheetLengthM * input.sheetWidthM * (1 - input.overlapPercent / 100);
  const withWaste = roof * (1 + input.wastagePercent / 100);
  const sheets = Math.ceil(withWaste / usableSheet - 1e-9);
  return {
    planAreaM2: plan,
    slopeFactor: roundQuantity(slope, 3),
    roofAreaM2: roof,
    sheetsRequired: sheets,
    formula:
      'roof area = plan L × W / cos(pitch); sheets = ceil(roof × (1 + wastage) / effective sheet area)',
    assumptions: [
      `Simple rectangular plan roof at ${input.pitchDegrees}° pitch.`,
      `${input.overlapPercent}% overlap and ${input.wastagePercent}% wastage are planning allowances.`,
      'Does not design purlins, wind loads or waterproofing details.',
    ],
    disclaimer: ADVANCED_PLANNING_DISCLAIMER,
    version: ADVANCED_CALC_VERSION,
  };
}

export const wallAreaInputSchema = z.object({
  wallLength: z.number().positive().max(500),
  wallHeight: z.number().positive().max(50),
  wallCount: z.number().int().min(1).max(40).default(1),
  dimensionUnit: lengthUnitSchema.default('m'),
  openingWidth: z.number().min(0).max(20).default(0),
  openingHeight: z.number().min(0).max(20).default(0),
  openingCount: z.number().int().min(0).max(200).default(0),
  openingUnit: lengthUnitSchema.default('m'),
});

export function calculateWallArea(raw: z.input<typeof wallAreaInputSchema>) {
  const input = wallAreaInputSchema.parse(raw);
  const L = m(input.wallLength, input.dimensionUnit);
  const H = m(input.wallHeight, input.dimensionUnit);
  const gross = roundQuantity(L * H * input.wallCount, 3);
  const ow = m(input.openingWidth, input.openingUnit);
  const oh = m(input.openingHeight, input.openingUnit);
  const openings = roundQuantity(ow * oh * input.openingCount, 3);
  const net = roundQuantity(Math.max(0, gross - openings), 3);
  return {
    grossAreaM2: gross,
    openingAreaM2: openings,
    netAreaM2: net,
    netAreaSqft: roundQuantity(net * 10.7639, 2),
    formula: 'net area = walls × L × H − openings',
    assumptions: [
      `${input.wallCount} rectangular wall face(s).`,
      'Use this net area in paint, tile or plaster calculators.',
    ],
    disclaimer: ADVANCED_PLANNING_DISCLAIMER,
    version: ADVANCED_CALC_VERSION,
  };
}

export const excavationInputSchema = z.object({
  length: z.number().positive().max(500),
  width: z.number().positive().max(500),
  depth: z.number().positive().max(50),
  dimensionUnit: lengthUnitSchema.default('m'),
  bulkingPercent: z.number().min(0).max(40).default(20),
});

export function calculateExcavation(raw: z.input<typeof excavationInputSchema>) {
  const input = excavationInputSchema.parse(raw);
  const L = m(input.length, input.dimensionUnit);
  const W = m(input.width, input.dimensionUnit);
  const D = m(input.depth, input.dimensionUnit);
  const inSitu = roundQuantity(L * W * D, 3);
  const loose = roundQuantity(inSitu * (1 + input.bulkingPercent / 100), 3);
  return {
    inSituVolumeM3: inSitu,
    looseVolumeM3: loose,
    formula: 'in-situ volume = L × W × D; loose volume = in-situ × (1 + bulking %)',
    assumptions: [
      `Rectangular pit ${L.toFixed(2)} × ${W.toFixed(2)} × ${D.toFixed(2)} m.`,
      `${input.bulkingPercent}% bulking is a planning allowance, not a soil investigation.`,
    ],
    disclaimer: `${ADVANCED_PLANNING_DISCLAIMER} Not a geotechnical or shoring design.`,
    version: ADVANCED_CALC_VERSION,
  };
}
