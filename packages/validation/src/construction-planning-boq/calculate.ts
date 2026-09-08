import { roundMoney, roundQuantity } from '../construction-engine/money';
import { PLANNING_BOQ_DISCLAIMER, PLANNING_BOQ_SECTIONS, PLANNING_BOQ_VERSION } from './types';
import { sectionLabel } from './template';
import type { Boq, BoqItem, PlanningBoqTotals } from './types';

export function derivedItemAmount(item: Pick<BoqItem, 'quantity' | 'rate' | 'isIncluded'>): number {
  if (!item.isIncluded) return 0;
  return roundMoney((Number(item.quantity) || 0) * (Number(item.rate) || 0));
}

export function calculatePlanningBoq(boq: Boq): PlanningBoqTotals {
  const items = boq.items.map((item) => {
    const quantity = roundQuantity(Math.max(0, Number(item.quantity) || 0), 4);
    const rate = roundMoney(Math.max(0, Number(item.rate) || 0));
    const next = { ...item, quantity, rate };
    return {
      ...next,
      amount: derivedItemAmount(next),
      status: item.isIncluded ? ('included' as const) : ('excluded' as const),
    };
  });

  const sectionSubtotals = PLANNING_BOQ_SECTIONS.map((section) => {
    const rows = items.filter((item) => item.sectionId === section.id);
    return {
      sectionId: section.id,
      label: sectionLabel(section.id),
      amount: roundMoney(rows.reduce((sum, row) => sum + row.amount, 0)),
      includedCount: rows.filter((row) => row.isIncluded).length,
      itemCount: rows.length,
    };
  });

  const subtotal = roundMoney(items.reduce((sum, row) => sum + row.amount, 0));
  const contingencyPercent = Math.min(50, Math.max(0, Number(boq.contingencyPercent) || 0));
  const contingencyAmount = roundMoney(subtotal * (contingencyPercent / 100));
  const taxable = subtotal + contingencyAmount;
  const taxPercent =
    boq.includeTax && boq.taxPercent != null && boq.taxPercent > 0 ? boq.taxPercent : null;
  const taxAmount = taxPercent != null ? roundMoney(taxable * (taxPercent / 100)) : null;
  const grandTotal = roundMoney(taxable + (taxAmount ?? 0));

  return {
    items,
    sectionSubtotals,
    subtotal,
    contingencyPercent,
    contingencyAmount,
    taxPercent,
    taxAmount,
    grandTotal,
    disclaimer: PLANNING_BOQ_DISCLAIMER,
    version: PLANNING_BOQ_VERSION,
  };
}
