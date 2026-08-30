import type { ConstructionEngineLimits } from './types';

export const DEFAULT_ENGINE_LIMITS: ConstructionEngineLimits = {
  maxAbsoluteValue: 1e12,
  maxQuantity: 1e9,
  maxUnitPrice: 1e8,
  maxTotal: 1e12,
  minPositive: 1e-12,
  maxWastagePercent: 100,
};

export function assertFiniteNumber(
  value: unknown,
  field: string,
): { ok: true; value: number } | { ok: false; error: string } {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { ok: false, error: `${field} must be a finite number` };
  }
  return { ok: true, value };
}

export function assertNonNegative(
  value: number,
  field: string,
): { ok: true } | { ok: false; error: string } {
  if (value < 0) return { ok: false, error: `${field} cannot be negative` };
  return { ok: true };
}

export function assertPositive(
  value: number,
  field: string,
  minPositive = DEFAULT_ENGINE_LIMITS.minPositive,
): { ok: true } | { ok: false; error: string } {
  if (value <= 0) return { ok: false, error: `${field} must be greater than zero` };
  if (value < minPositive) {
    return { ok: false, error: `${field} is unrealistically small` };
  }
  return { ok: true };
}

export function assertWithinLimit(
  value: number,
  max: number,
  field: string,
): { ok: true } | { ok: false; error: string } {
  if (Math.abs(value) > max) {
    return { ok: false, error: `${field} exceeds allowed maximum (${max})` };
  }
  return { ok: true };
}
