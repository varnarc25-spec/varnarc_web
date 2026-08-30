/** Construction calculation engine — types (no UI). */

export type ConstructionDimension = 'length' | 'area' | 'volume' | 'mass' | 'liquid' | 'count';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type ConstructionQuantityValue = {
  value: number;
  unit: string;
  /** SI / canonical value used internally */
  normalizedValue: number;
  normalizedUnit: string;
  dimension: ConstructionDimension;
};

export type ConstructionCostLine = {
  key: string;
  label: string;
  quantity: number;
  quantityUnit: string;
  unitPrice: number;
  currency: string;
  amount: number;
  wastagePercent?: number;
};

export type ConstructionCalculationRange = {
  low: number;
  mid: number;
  high: number;
  currency: string;
  basis: string;
};

export type ConstructionConfidence = {
  level: ConfidenceLevel;
  score: number;
  reasons: string[];
};

export type ConstructionCalculationWarning = {
  code: string;
  message: string;
};

export type ConstructionCalculationError = {
  code: string;
  message: string;
};

export type ConstructionCalculationAssumptions = {
  wastagePercent?: number;
  /** Relative spread around mid total, e.g. 0.1 = ±10% */
  rangeSpread?: number;
  currency?: string;
  notes?: string[];
  [key: string]: unknown;
};

export type ConstructionCalculationRequest = {
  /** Raw user-facing inputs (before normalization). */
  inputs: Record<string, unknown>;
  /** Human-readable / machine assumptions applied. */
  assumptions?: ConstructionCalculationAssumptions;
  /** Formula identifier or expression label (not executed as code). */
  formula: string;
  methodologyVersion: number | string;
  /**
   * Primary quantity to convert/normalize.
   * Either provide `quantity` + `unit`, or a length×width×height volume build.
   */
  quantity?: {
    value: number;
    unit: string;
    /** Target unit for output quantities (optional). */
    outputUnit?: string;
  };
  /** Optional rectangular volume builder (converted to cu m then to outputUnit). */
  dimensions?: {
    length: number;
    width: number;
    height?: number;
    unit: string;
    outputUnit?: string;
  };
  /** Optional unit price for cost multiplication. */
  unitPrice?: {
    amount: number;
    currency?: string;
    /** Unit the price is quoted in (must match quantity dimension). */
    perUnit: string;
  };
  /** Additional named quantity lines (already in their units). */
  lines?: Array<{
    key: string;
    label: string;
    value: number;
    unit: string;
    unitPrice?: number;
    wastagePercent?: number;
  }>;
  /** Soft/hard limits override. */
  limits?: Partial<ConstructionEngineLimits>;
};

export type ConstructionEngineLimits = {
  maxAbsoluteValue: number;
  maxQuantity: number;
  maxUnitPrice: number;
  maxTotal: number;
  minPositive: number;
  maxWastagePercent: number;
};

export type ConstructionCalculationResult = {
  ok: boolean;
  inputs: Record<string, unknown>;
  normalizedInputs: Record<string, unknown>;
  assumptions: ConstructionCalculationAssumptions;
  formula: string;
  quantities: Record<string, ConstructionQuantityValue>;
  costs: ConstructionCostLine[];
  totals: {
    quantity?: number;
    quantityUnit?: string;
    materialCost?: number;
    currency: string;
  };
  range: ConstructionCalculationRange | null;
  warnings: ConstructionCalculationWarning[];
  errors: ConstructionCalculationError[];
  confidence: ConstructionConfidence;
  methodologyVersion: string;
};
