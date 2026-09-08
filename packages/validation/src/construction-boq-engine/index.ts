import { rangeFromExpected } from '../construction-rate-resolution';
import { applyWastage } from '../construction-engine/wastage';

export type WorkItemResourceInput = {
  resourceType: 'MATERIAL' | 'LABOUR' | 'EQUIPMENT' | 'SUBCONTRACT';
  resourceKey: string;
  quantityCoefficient: number;
  wastagePercent: number;
  unit: string;
  rate: number;
  minRate?: number;
  maxRate?: number;
};

export function workItemMaterialQuantity(
  workQuantity: number,
  quantityCoefficient: number,
  wastagePercent: number,
): number {
  if (workQuantity < 0) throw new Error('Quantity cannot be negative.');
  if (quantityCoefficient < 0) throw new Error('Work coefficient cannot be negative.');
  const wasted = applyWastage(workQuantity * quantityCoefficient, wastagePercent);
  if (!wasted.ok) throw new Error(wasted.error);
  return wasted.value;
}

export function requiredLabourDays(workQuantity: number, outputPerDay: number): number {
  if (outputPerDay <= 0) throw new Error('Productivity must be positive.');
  if (workQuantity < 0) throw new Error('Work quantity cannot be negative.');
  return workQuantity / outputPerDay;
}

export function costRange(minRate: number, averageRate: number, maxRate: number, quantity: number) {
  return {
    low: Math.round(minRate * quantity),
    expected: Math.round(averageRate * quantity),
    high: Math.round(maxRate * quantity),
  };
}

export type DetailedEstimateTotals = {
  material: { low: number; expected: number; high: number };
  labour: { low: number; expected: number; high: number };
  equipment: { low: number; expected: number; high: number };
  subcontract: { low: number; expected: number; high: number };
  professionalFees: number;
  overhead: number;
  profit: number;
  tax: number;
  contingency: number;
  total: { low: number; expected: number; high: number };
};

function addRange(
  a: { low: number; expected: number; high: number },
  b: { low: number; expected: number; high: number },
) {
  return {
    low: a.low + b.low,
    expected: a.expected + b.expected,
    high: a.high + b.high,
  };
}

const ZERO = { low: 0, expected: 0, high: 0 };

export function calculateDetailedEstimate(input: {
  workQuantity: number;
  resources: WorkItemResourceInput[];
  labourOutputPerDay?: number;
  professionalFeePercent?: number;
  overheadPercent?: number;
  profitPercent?: number;
  taxPercent?: number;
  contingencyPercent?: number;
}): DetailedEstimateTotals {
  let material = { ...ZERO };
  let labour = { ...ZERO };
  let equipment = { ...ZERO };
  let subcontract = { ...ZERO };

  for (const resource of input.resources) {
    const qty =
      resource.resourceType === 'LABOUR' && input.labourOutputPerDay
        ? requiredLabourDays(input.workQuantity, input.labourOutputPerDay)
        : workItemMaterialQuantity(
            input.workQuantity,
            resource.quantityCoefficient,
            resource.wastagePercent,
          );
    const band = costRange(
      resource.minRate ?? resource.rate,
      resource.rate,
      resource.maxRate ?? resource.rate,
      qty,
    );
    if (resource.resourceType === 'MATERIAL') material = addRange(material, band);
    else if (resource.resourceType === 'LABOUR') labour = addRange(labour, band);
    else if (resource.resourceType === 'EQUIPMENT') equipment = addRange(equipment, band);
    else subcontract = addRange(subcontract, band);
  }

  const directExpected =
    material.expected + labour.expected + equipment.expected + subcontract.expected;
  const professionalFees = Math.round(directExpected * ((input.professionalFeePercent ?? 0) / 100));
  const overhead = Math.round(directExpected * ((input.overheadPercent ?? 0) / 100));
  const profit = Math.round((directExpected + overhead) * ((input.profitPercent ?? 0) / 100));
  const tax = Math.round(
    (directExpected + overhead + profit + professionalFees) * ((input.taxPercent ?? 0) / 100),
  );
  const beforeContingency = directExpected + professionalFees + overhead + profit + tax;
  const contingency = Math.round(beforeContingency * ((input.contingencyPercent ?? 0) / 100));
  const expected = beforeContingency + contingency;
  const spread = rangeFromExpected(expected);

  return {
    material,
    labour,
    equipment,
    subcontract,
    professionalFees,
    overhead,
    profit,
    tax,
    contingency,
    total: {
      low: spread.low,
      expected: spread.expected,
      high: spread.high,
    },
  };
}
