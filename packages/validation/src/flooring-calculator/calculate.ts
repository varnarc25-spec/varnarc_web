import { applyWastage } from '../construction-engine/wastage';
import { convertUnit } from '../construction-engine/units';
import { roundMoney, roundQuantity } from '../construction-engine/money';
import {
  FLOORING_CALC_VERSION,
  FLOORING_DEFAULT_WASTAGE,
  M2_TO_FT2,
  flooringTypeLabel,
} from './rates';
import {
  flooringCalculatorInputSchema,
  type FlooringCalculatorInput,
  type FlooringCalculatorResult,
  type FlooringRoomBreakdown,
  type FlooringRoomInput,
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

function materialUnitLabel(unit: FlooringCalculatorResult['materialUnit']): string {
  if (unit === 'm2') return 'm²';
  if (unit === 'ft2') return 'ft²';
  if (unit === 'yard2') return 'sq yd';
  return 'boxes';
}

/**
 * Generic flooring area / purchase / cost calculator.
 * Category defaults are wastage suggestions only — no product endorsements.
 */
export function calculateFlooringQuantity(raw: FlooringCalculatorInput): FlooringCalculatorResult {
  const input = flooringCalculatorInputSchema.parse(raw);
  const steps: string[] = [];
  const typeLabel = flooringTypeLabel(input.flooringType, input.customTypeLabel);
  const wastagePercent = input.wastagePercent ?? FLOORING_DEFAULT_WASTAGE[input.flooringType];

  const roomList: FlooringRoomInput[] =
    input.rooms != null && input.rooms.length > 0
      ? input.rooms
      : [
          {
            name: 'Room 1',
            length: input.length!,
            width: input.width!,
            lengthUnit: input.lengthUnit,
            widthUnit: input.widthUnit,
          },
        ];

  // Single-room path can multiply by numberOfRooms when no multi-row list
  const multiplyRooms = input.rooms == null || input.rooms.length === 0 ? input.numberOfRooms : 1;

  const rooms: FlooringRoomBreakdown[] = [];
  let netFloorAreaM2 = 0;

  for (let i = 0; i < roomList.length; i++) {
    const room = roomList[i]!;
    const L = toM(room.length, room.lengthUnit);
    const W = toM(room.width, room.widthUnit);
    const areaOne = L * W;
    const area = areaOne * (roomList.length === 1 ? multiplyRooms : 1);
    const name =
      room.name ??
      (roomList.length === 1 && multiplyRooms > 1
        ? `${multiplyRooms} identical rooms`
        : `Room ${i + 1}`);
    rooms.push({
      id: room.id ?? `room-${i + 1}`,
      name,
      areaM2: roundQuantity(area, 4),
      areaFt2: roundQuantity(area * M2_TO_FT2, 2),
    });
    netFloorAreaM2 += area;
    steps.push(
      `${name}: ${roundQuantity(L, 3)} × ${roundQuantity(W, 3)} m${
        roomList.length === 1 && multiplyRooms > 1 ? ` × ${multiplyRooms}` : ''
      } = ${roundQuantity(area, 4)} m².`,
    );
  }

  if (rooms.length > 1) {
    steps.push(`Net floor area (sum) = ${roundQuantity(netFloorAreaM2, 4)} m².`);
  }

  const waste = applyWastage(netFloorAreaM2, wastagePercent);
  if (!waste.ok) throw new Error(waste.error);
  const purchaseAreaM2 = waste.value;
  const wastageAreaM2 = purchaseAreaM2 - netFloorAreaM2;

  steps.push(
    `Wastage ${wastagePercent}% → purchase area ${roundQuantity(purchaseAreaM2, 4)} m² (extra ${roundQuantity(wastageAreaM2, 4)} m²).`,
  );

  let materialQuantity: number;
  const unit = input.materialUnit;

  if (unit === 'box') {
    const boxCoverageM2 = toM2(input.coveragePerBox!, input.coveragePerBoxUnit);
    materialQuantity = Math.ceil(purchaseAreaM2 / boxCoverageM2 - 1e-9);
    steps.push(
      `Boxes = ceil(${roundQuantity(purchaseAreaM2, 4)} / ${roundQuantity(boxCoverageM2, 4)} m² per box) = ${materialQuantity}.`,
    );
  } else if (unit === 'ft2') {
    materialQuantity = roundQuantity(purchaseAreaM2 * M2_TO_FT2, 2);
    steps.push(`Material quantity = ${materialQuantity} ft².`);
  } else if (unit === 'yard2') {
    materialQuantity = roundQuantity(requireConvert(purchaseAreaM2, 'm2', 'yard2'), 2);
    steps.push(`Material quantity = ${materialQuantity} sq yd.`);
  } else {
    materialQuantity = roundQuantity(purchaseAreaM2, 4);
    steps.push(`Material quantity = ${materialQuantity} m².`);
  }

  let estimatedCostInr: number | null = null;
  if (input.rateInr != null && input.rateInr > 0) {
    estimatedCostInr = roundMoney(materialQuantity * input.rateInr);
    steps.push(
      `Cost = ${materialQuantity} ${materialUnitLabel(unit)} × ₹${input.rateInr} ≈ ₹${estimatedCostInr}.`,
    );
  }

  const defaultWaste = FLOORING_DEFAULT_WASTAGE[input.flooringType];
  const usedSuggested =
    input.wastagePercent == null || Math.abs(wastagePercent - defaultWaste) < 1e-9;

  return {
    flooringType: input.flooringType,
    flooringTypeLabel: typeLabel,
    netFloorAreaM2: roundQuantity(netFloorAreaM2, 4),
    netFloorAreaFt2: roundQuantity(netFloorAreaM2 * M2_TO_FT2, 2),
    purchaseAreaM2: roundQuantity(purchaseAreaM2, 4),
    purchaseAreaFt2: roundQuantity(purchaseAreaM2 * M2_TO_FT2, 2),
    wastagePercent,
    wastageAreaM2: roundQuantity(wastageAreaM2, 4),
    materialUnit: unit,
    materialQuantity,
    materialUnitLabel: materialUnitLabel(unit),
    rooms,
    rateInr: input.rateInr ?? null,
    estimatedCostInr,
    formula:
      'A_net = Σ(L × W) · A_buy = A_net × (1 + wastage%) · qty = convert(A_buy → unit) · cost = qty × rate',
    steps,
    assumptions: [
      `Flooring category: ${typeLabel} (category label only — not a product recommendation).`,
      usedSuggested
        ? `Wastage ${wastagePercent}% uses the suggested default for this category (editable).`
        : `Wastage ${wastagePercent}% (user override; category suggestion is ${defaultWaste}%).`,
      `Material priced/ordered in ${materialUnitLabel(unit)}.`,
      'No brand or product endorsement is implied by this calculator.',
      'Indicative planning only — confirm cuts, pattern matching and underlay with your supplier.',
    ],
    disclaimer:
      'This flooring estimate is educational only. It is not a quote or product recommendation. Compare materials separately if you need side-by-side options.',
    version: FLOORING_CALC_VERSION,
  };
}
