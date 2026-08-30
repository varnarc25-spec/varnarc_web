import {
  assertFiniteNumber,
  assertNonNegative,
  assertPositive,
  assertWithinLimit,
  DEFAULT_ENGINE_LIMITS,
} from './guards';
import { multiplyQuantityPrice, roundMoney, roundQuantity } from './money';
import { BASE_UNITS, convertUnit, getUnitDimension, resolveUnit, toBaseUnit } from './units';
import { applyWastage } from './wastage';
import type {
  ConstructionCalculationAssumptions,
  ConstructionCalculationRequest,
  ConstructionCalculationResult,
  ConstructionCalculationWarning,
  ConstructionConfidence,
  ConstructionCostLine,
  ConstructionEngineLimits,
  ConstructionQuantityValue,
} from './types';

function mergeLimits(overrides?: Partial<ConstructionEngineLimits>): ConstructionEngineLimits {
  return { ...DEFAULT_ENGINE_LIMITS, ...overrides };
}

function buildConfidence(input: {
  hasUnitPrice: boolean;
  wastagePercent: number;
  rangeSpread: number;
  warningCount: number;
  errorCount: number;
}): ConstructionConfidence {
  const reasons: string[] = [];
  let score = 0.85;

  if (!input.hasUnitPrice) {
    score -= 0.15;
    reasons.push('No unit price provided — quantity-only estimate');
  }
  if (input.wastagePercent > 15) {
    score -= 0.1;
    reasons.push('High wastage assumption increases uncertainty');
  }
  if (input.rangeSpread > 0.15) {
    score -= 0.1;
    reasons.push('Wide cost range configured');
  }
  if (input.warningCount > 0) {
    score -= Math.min(0.2, input.warningCount * 0.05);
    reasons.push('Warnings present on this calculation');
  }
  if (input.errorCount > 0) {
    score = Math.min(score, 0.2);
    reasons.push('Calculation errors present');
  }
  if (reasons.length === 0) reasons.push('Standard assumptions applied');

  score = Math.max(0, Math.min(1, roundQuantity(score, 2)));
  const level = score >= 0.75 ? 'high' : score >= 0.45 ? 'medium' : 'low';
  return { level, score, reasons };
}

function makeQuantity(
  value: number,
  unit: string,
  normalizedValue: number,
  normalizedUnit: string,
  dimension: ConstructionQuantityValue['dimension'],
): ConstructionQuantityValue {
  return {
    value: roundQuantity(value),
    unit,
    normalizedValue: roundQuantity(normalizedValue),
    normalizedUnit,
    dimension,
  };
}

/**
 * Run a deterministic construction calculation.
 * Does not execute arbitrary formula strings — `formula` is metadata / methodology label.
 */
export function runConstructionCalculation(
  request: ConstructionCalculationRequest,
): ConstructionCalculationResult {
  const limits = mergeLimits(request.limits);
  const errors: ConstructionCalculationResult['errors'] = [];
  const warnings: ConstructionCalculationWarning[] = [];
  const assumptions: ConstructionCalculationAssumptions = {
    wastagePercent: 0,
    rangeSpread: 0.1,
    currency: 'INR',
    notes: ['Indicative estimate only — verify with local suppliers.'],
    ...request.assumptions,
  };

  const wastagePercent = Number(assumptions.wastagePercent ?? 0);
  const rangeSpread = Number(assumptions.rangeSpread ?? 0.1);
  const currency = String(
    assumptions.currency ?? request.unitPrice?.currency ?? 'INR',
  ).toUpperCase();

  const quantities: Record<string, ConstructionQuantityValue> = {};
  const costs: ConstructionCostLine[] = [];
  const normalizedInputs: Record<string, unknown> = {
    currency,
    wastagePercent,
    rangeSpread,
    methodologyVersion: String(request.methodologyVersion),
  };

  // --- validate assumptions ---
  const wastageCheck = assertNonNegative(wastagePercent, 'wastagePercent');
  if (!wastageCheck.ok) errors.push({ code: 'invalid_wastage', message: wastageCheck.error });
  if (wastagePercent > limits.maxWastagePercent) {
    errors.push({
      code: 'wastage_too_high',
      message: `wastagePercent exceeds ${limits.maxWastagePercent}%`,
    });
  }
  if (rangeSpread < 0 || rangeSpread > 1) {
    errors.push({ code: 'invalid_range_spread', message: 'rangeSpread must be between 0 and 1' });
  }

  // --- primary quantity ---
  let primaryQty: number | null = null;
  let primaryUnit: string | null = null;

  if (request.quantity) {
    const raw = assertFiniteNumber(request.quantity.value, 'quantity.value');
    if (!raw.ok) {
      errors.push({ code: 'invalid_quantity', message: raw.error });
    } else {
      const positive = assertPositive(raw.value, 'quantity.value', limits.minPositive);
      if (!positive.ok) errors.push({ code: 'invalid_quantity', message: positive.error });
      const within = assertWithinLimit(raw.value, limits.maxQuantity, 'quantity.value');
      if (!within.ok) errors.push({ code: 'quantity_overflow', message: within.error });

      const resolved = resolveUnit(request.quantity.unit);
      if (!resolved) {
        errors.push({
          code: 'unsupported_unit',
          message: `Unsupported unit: ${request.quantity.unit}`,
        });
      } else {
        const outputUnit = request.quantity.outputUnit ?? resolved.canonical;
        const converted = convertUnit(raw.value, request.quantity.unit, outputUnit);
        if (!converted.ok) {
          errors.push({ code: 'unit_conversion', message: converted.error });
        } else {
          const base = toBaseUnit(converted.value, outputUnit);
          if (!base.ok) {
            errors.push({ code: 'unit_conversion', message: base.error });
          } else {
            primaryQty = converted.value;
            primaryUnit = converted.to;
            quantities.primary = makeQuantity(
              converted.value,
              converted.to,
              base.value,
              BASE_UNITS[converted.dimension],
              converted.dimension,
            );
            normalizedInputs.quantity = {
              value: converted.value,
              unit: converted.to,
              baseValue: base.value,
              baseUnit: BASE_UNITS[converted.dimension],
            };
          }
        }
      }
    }
  }

  // --- dimensions → volume ---
  if (request.dimensions) {
    const { length, width, height = 1, unit, outputUnit } = request.dimensions;
    for (const [name, val] of [
      ['length', length],
      ['width', width],
      ['height', height],
    ] as const) {
      const n = assertFiniteNumber(val, `dimensions.${name}`);
      if (!n.ok) {
        errors.push({ code: 'invalid_dimension', message: n.error });
        continue;
      }
      const p = assertPositive(n.value, `dimensions.${name}`, limits.minPositive);
      if (!p.ok) errors.push({ code: 'invalid_dimension', message: p.error });
      const w = assertWithinLimit(n.value, limits.maxAbsoluteValue, `dimensions.${name}`);
      if (!w.ok) errors.push({ code: 'dimension_overflow', message: w.error });
    }

    const dimUnit = resolveUnit(unit);
    if (!dimUnit || dimUnit.dimension !== 'length') {
      errors.push({
        code: 'invalid_dimension_unit',
        message: 'dimensions.unit must be a length unit',
      });
    } else if (
      errors.every((e) => e.code !== 'invalid_dimension' && e.code !== 'dimension_overflow')
    ) {
      const l = convertUnit(length, unit, 'm');
      const w = convertUnit(width, unit, 'm');
      const h = convertUnit(height, unit, 'm');
      if (!l.ok || !w.ok || !h.ok) {
        errors.push({
          code: 'unit_conversion',
          message: 'Failed to convert dimensions to metres',
        });
      } else {
        const volumeM3 = l.value * w.value * h.value;
        const target = outputUnit ?? 'm3';
        const toOut = convertUnit(volumeM3, 'm3', target);
        if (!toOut.ok) {
          errors.push({ code: 'unit_conversion', message: toOut.error });
        } else {
          const within = assertWithinLimit(toOut.value, limits.maxQuantity, 'volume');
          if (!within.ok) {
            errors.push({ code: 'quantity_overflow', message: within.error });
          } else {
            primaryQty = toOut.value;
            primaryUnit = toOut.to;
            quantities.volume = makeQuantity(toOut.value, toOut.to, volumeM3, 'm3', 'volume');
            normalizedInputs.dimensions = {
              lengthM: roundQuantity(l.value),
              widthM: roundQuantity(w.value),
              heightM: roundQuantity(h.value),
              volumeM3: roundQuantity(volumeM3),
              outputUnit: toOut.to,
              outputValue: roundQuantity(toOut.value),
            };
          }
        }
      }
    }
  }

  // --- wastage on primary ---
  let billedQty = primaryQty;
  if (primaryQty != null && primaryUnit && errors.length === 0) {
    const wasted = applyWastage(primaryQty, wastagePercent, limits.maxWastagePercent);
    if (!wasted.ok) {
      errors.push({ code: 'wastage', message: wasted.error });
    } else {
      billedQty = wasted.value;
      quantities.withWastage = makeQuantity(
        wasted.value,
        primaryUnit,
        quantities.primary?.normalizedValue != null
          ? quantities.primary.normalizedValue * (1 + wastagePercent / 100)
          : quantities.volume?.normalizedValue != null
            ? quantities.volume.normalizedValue * (1 + wastagePercent / 100)
            : wasted.value,
        quantities.primary?.normalizedUnit ?? quantities.volume?.normalizedUnit ?? primaryUnit,
        quantities.primary?.dimension ?? quantities.volume?.dimension ?? 'count',
      );
      if (wastagePercent === 0) {
        warnings.push({
          code: 'zero_wastage',
          message: 'Wastage is 0% — site wastage is often 2–10% depending on material.',
        });
      }
    }
  }

  // --- unit price × quantity ---
  let materialCost: number | undefined;
  if (request.unitPrice && billedQty != null && primaryUnit && errors.length === 0) {
    const price = assertFiniteNumber(request.unitPrice.amount, 'unitPrice.amount');
    if (!price.ok) {
      errors.push({ code: 'invalid_unit_price', message: price.error });
    } else {
      const nn = assertNonNegative(price.value, 'unitPrice.amount');
      if (!nn.ok) errors.push({ code: 'invalid_unit_price', message: nn.error });
      const within = assertWithinLimit(price.value, limits.maxUnitPrice, 'unitPrice.amount');
      if (!within.ok) errors.push({ code: 'unit_price_overflow', message: within.error });

      const priceUnit = resolveUnit(request.unitPrice.perUnit);
      const qtyDim = getUnitDimension(primaryUnit);
      if (!priceUnit) {
        errors.push({
          code: 'unsupported_unit',
          message: `Unsupported price unit: ${request.unitPrice.perUnit}`,
        });
      } else if (qtyDim && priceUnit.dimension !== qtyDim) {
        errors.push({
          code: 'unit_mismatch',
          message: `Price per ${priceUnit.canonical} is incompatible with quantity in ${primaryUnit}`,
        });
      } else {
        // Convert billed qty into the price's per-unit
        const qtyInPriceUnit = convertUnit(billedQty, primaryUnit, priceUnit.canonical);
        if (!qtyInPriceUnit.ok) {
          errors.push({ code: 'unit_conversion', message: qtyInPriceUnit.error });
        } else {
          const amount = multiplyQuantityPrice(qtyInPriceUnit.value, price.value);
          const totalCheck = assertWithinLimit(amount, limits.maxTotal, 'materialCost');
          if (!totalCheck.ok || !Number.isFinite(amount)) {
            errors.push({
              code: 'total_overflow',
              message: totalCheck.ok ? 'Cost calculation overflow' : totalCheck.error,
            });
          } else {
            materialCost = amount;
            costs.push({
              key: 'primary',
              label: 'Material',
              quantity: roundQuantity(qtyInPriceUnit.value),
              quantityUnit: priceUnit.canonical,
              unitPrice: roundMoney(price.value),
              currency,
              amount,
              wastagePercent,
            });
            normalizedInputs.unitPrice = {
              amount: roundMoney(price.value),
              perUnit: priceUnit.canonical,
              currency,
            };
          }
        }
      }
    }
  }

  // --- extra lines ---
  if (request.lines?.length) {
    for (const line of request.lines) {
      const raw = assertFiniteNumber(line.value, `lines.${line.key}`);
      if (!raw.ok) {
        errors.push({ code: 'invalid_line', message: raw.error });
        continue;
      }
      const positive = assertPositive(raw.value, `lines.${line.key}`, limits.minPositive);
      if (!positive.ok) {
        errors.push({ code: 'invalid_line', message: positive.error });
        continue;
      }
      const resolved = resolveUnit(line.unit);
      if (!resolved) {
        errors.push({
          code: 'unsupported_unit',
          message: `Unsupported unit on line ${line.key}: ${line.unit}`,
        });
        continue;
      }
      const lineWastage = line.wastagePercent ?? wastagePercent;
      const wasted = applyWastage(raw.value, lineWastage, limits.maxWastagePercent);
      if (!wasted.ok) {
        errors.push({ code: 'wastage', message: `${line.key}: ${wasted.error}` });
        continue;
      }
      const base = toBaseUnit(wasted.value, resolved.canonical);
      if (!base.ok) {
        errors.push({ code: 'unit_conversion', message: base.error });
        continue;
      }
      quantities[line.key] = makeQuantity(
        wasted.value,
        resolved.canonical,
        base.value,
        BASE_UNITS[resolved.dimension],
        resolved.dimension,
      );

      if (line.unitPrice != null) {
        const p = assertFiniteNumber(line.unitPrice, `lines.${line.key}.unitPrice`);
        if (!p.ok) {
          errors.push({ code: 'invalid_unit_price', message: p.error });
          continue;
        }
        const amount = multiplyQuantityPrice(wasted.value, p.value);
        if (!Number.isFinite(amount) || Math.abs(amount) > limits.maxTotal) {
          errors.push({
            code: 'total_overflow',
            message: `Line ${line.key} cost exceeds allowed maximum`,
          });
          continue;
        }
        costs.push({
          key: line.key,
          label: line.label,
          quantity: roundQuantity(wasted.value),
          quantityUnit: resolved.canonical,
          unitPrice: roundMoney(p.value),
          currency,
          amount,
          wastagePercent: lineWastage,
        });
      }
    }
  }

  const costsTotal =
    costs.length > 0 ? roundMoney(costs.reduce((sum, c) => sum + c.amount, 0)) : materialCost;

  if (costsTotal != null && costs.length > 1) {
    materialCost = costsTotal;
  }

  if (costsTotal != null && costsTotal > 1_000_000) {
    warnings.push({
      code: 'large_total',
      message: 'Total exceeds ₹10 lakh — double-check inputs for realism.',
    });
  }

  const ok = errors.length === 0;
  const mid = ok && costsTotal != null ? costsTotal : null;
  const range =
    mid != null
      ? {
          low: roundMoney(mid * (1 - rangeSpread)),
          mid,
          high: roundMoney(mid * (1 + rangeSpread)),
          currency,
          basis: `±${roundQuantity(rangeSpread * 100, 2)}% around mid estimate`,
        }
      : null;

  const confidence = buildConfidence({
    hasUnitPrice: Boolean(request.unitPrice) || costs.some((c) => c.unitPrice > 0),
    wastagePercent,
    rangeSpread,
    warningCount: warnings.length,
    errorCount: errors.length,
  });

  return {
    ok,
    inputs: { ...request.inputs },
    normalizedInputs,
    assumptions: {
      ...assumptions,
      wastagePercent,
      rangeSpread,
      currency,
    },
    formula: request.formula,
    quantities,
    costs,
    totals: {
      quantity: billedQty != null ? roundQuantity(billedQty) : undefined,
      quantityUnit: primaryUnit ?? undefined,
      materialCost: mid ?? undefined,
      currency,
    },
    range,
    warnings,
    errors,
    confidence,
    methodologyVersion: String(request.methodologyVersion),
  };
}

export { DEFAULT_ENGINE_LIMITS };
