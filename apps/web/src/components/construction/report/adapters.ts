/**
 * Adapters: calculator results → ConstructionCalculationReportData
 * (no private user/project fields).
 */

import type {
  BoqGeneratorResult,
  CementCalculatorResult,
  ConstructionCostResult,
  ScenarioCompareResult,
} from '@varnarc/validation';
import {
  DEFAULT_CONSTRUCTION_REPORT_DISCLAIMER,
  type ConstructionCalculationReportData,
  kvFromRecord,
} from './types';

function inr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function reportFromCostCalculation(input: {
  result: ConstructionCostResult;
  form: Record<string, unknown>;
}): ConstructionCalculationReportData {
  const { result, form } = input;
  return {
    calculatorSlug: 'cost-calculator',
    title: 'Construction Cost Estimate',
    subtitle: `${String(form.location ?? 'India')} · ${result.mode === 'reverse' ? 'Budget → area' : 'Area → cost'}`,
    generatedAt: new Date().toISOString(),
    currency: 'INR',
    inputs: [
      { label: 'Mode', value: result.mode },
      { label: 'Location', value: String(form.location ?? '—') },
      { label: 'Property type', value: String(form.propertyType ?? '—') },
      {
        label: 'Built-up area',
        value: `${result.areaSqft.toLocaleString('en-IN')} sq ft`,
      },
      { label: 'Floors', value: String(form.floors ?? '—') },
      { label: 'Quality', value: String(form.quality ?? '—') },
      { label: 'Contingency', value: `${result.contingencyPercent}%` },
    ],
    results: [
      {
        label: result.mode === 'reverse' ? 'Approximate buildable area' : 'Estimated total',
        value:
          result.mode === 'reverse'
            ? `${result.areaSqft.toLocaleString('en-IN')} sq ft`
            : inr(result.estimatedTotal),
      },
      { label: 'Cost per sq ft', value: inr(result.costPerSqft) },
      {
        label: 'Likely range',
        value: `${inr(result.rangeLow)} – ${inr(result.rangeHigh)}`,
      },
      { label: 'Materials (est.)', value: inr(result.materialCost) },
      { label: 'Labour (est.)', value: inr(result.labourCost) },
      {
        label: 'Confidence',
        value: `${result.confidence} (${Math.round(result.confidenceScore * 100)}%)`,
      },
    ],
    breakdown: result.categoryBreakdown.map((row) => ({
      id: row.label,
      label: row.label,
      value: `${inr(row.amount)} (${row.percentOfTotal}%)`,
    })),
    assumptions: result.assumptions,
    methodology: {
      versionLabel: result.version,
      formula: result.formula,
      steps: result.methodology?.steps,
    },
    disclaimer: result.disclaimer || DEFAULT_CONSTRUCTION_REPORT_DISCLAIMER,
  };
}

export function reportFromCementCalculation(input: {
  result: CementCalculatorResult;
  form: Record<string, unknown>;
}): ConstructionCalculationReportData {
  const { result, form } = input;
  return {
    calculatorSlug: 'cement-calculator',
    title: 'Cement Calculation Report',
    subtitle: String(form.useCase ?? result.useCase ?? 'Cement'),
    generatedAt: new Date().toISOString(),
    inputs: kvFromRecord(
      {
        mode: form.mode ?? result.mode,
        useCase: form.useCase ?? result.useCase,
        volume: form.volume,
        area: form.area,
        thickness: form.thickness,
        mixPreset: form.mixPreset ?? result.mixLabel,
        wastagePercent: form.wastagePercent ?? result.wastagePercent,
        bagSizeKg: form.bagSizeKg ?? result.bagSizeKg,
      },
      { max: 16 },
    ),
    results: [
      { label: 'Cement', value: `${result.cementKg} kg` },
      { label: 'Bags', value: String(result.bags) },
      ...(result.estimatedCostInr != null
        ? [{ label: 'Estimated cement cost', value: inr(result.estimatedCostInr) }]
        : []),
      ...(result.sandVolumeM3 != null
        ? [{ label: 'Related sand', value: `${result.sandVolumeM3} m³` }]
        : []),
      ...(result.aggregateVolumeM3 != null
        ? [{ label: 'Related aggregate', value: `${result.aggregateVolumeM3} m³` }]
        : []),
    ],
    assumptions: result.assumptions,
    methodology: {
      versionLabel: result.version,
      formula: result.formula,
      steps: result.steps,
    },
    disclaimer: result.disclaimer || DEFAULT_CONSTRUCTION_REPORT_DISCLAIMER,
  };
}

export function reportFromBoq(input: {
  result: BoqGeneratorResult;
}): ConstructionCalculationReportData {
  const { result } = input;
  return {
    calculatorSlug: 'boq-generator',
    title: 'Bill of Quantities (BOQ)',
    subtitle: result.title,
    generatedAt: new Date().toISOString(),
    currency: result.currency,
    inputs: [
      { label: 'Currency', value: result.currency },
      { label: 'Line items', value: String(result.lines.length) },
      { label: 'Contingency', value: `${result.contingencyPercent}%` },
    ],
    results: [
      { label: 'Subtotal', value: inr(result.subtotal) },
      { label: 'Contingency amount', value: inr(result.contingencyAmount) },
      ...(result.taxAmount != null ? [{ label: 'Tax', value: inr(result.taxAmount) }] : []),
      { label: 'Grand total', value: inr(result.grandTotal) },
    ],
    breakdown: result.categorySubtotals.map((c) => ({
      label: c.category,
      value: inr(c.amount),
    })),
    breakdownRows: result.lines.slice(0, 80).map((line) => ({
      label: line.item,
      quantity: String(line.quantity),
      unit: line.unit,
      rate: inr(line.rate),
      amount: inr(line.amount),
    })),
    assumptions: result.assumptions,
    methodology: { versionLabel: result.version },
    disclaimer: result.qualification || DEFAULT_CONSTRUCTION_REPORT_DISCLAIMER,
  };
}

export function reportFromScenarioCompare(input: {
  result: ScenarioCompareResult;
}): ConstructionCalculationReportData {
  const { result } = input;
  const byId = new Map(result.scenarios.map((s) => [s.config.id, s]));
  const lowest = byId.get(result.highlights.lowestCostScenarioId);
  const highest = byId.get(result.highlights.highestCostScenarioId);

  return {
    calculatorSlug: 'scenario-compare',
    title: 'Construction Scenario Comparison',
    subtitle: `${result.scenarios.length} scenarios`,
    generatedAt: new Date().toISOString(),
    currency: 'INR',
    inputs: result.scenarios.map((s) => ({
      id: s.config.id,
      label: s.config.label,
      value: `${s.config.location} · ${s.config.builtUpArea} ${s.config.areaUnit} · ${s.config.floors} floor(s) · ${s.config.quality}`,
    })),
    results: result.scenarios.map((s) => ({
      id: `r-${s.config.id}`,
      label: s.config.label,
      value: `${inr(s.estimatedTotal)} (${inr(s.costPerSqft)}/sq ft)`,
      hint: `Range ${inr(s.rangeLow)} – ${inr(s.rangeHigh)}`,
    })),
    breakdown: [
      ...(lowest
        ? [
            {
              label: 'Lowest cost scenario',
              value: `${lowest.config.label} · ${inr(lowest.estimatedTotal)}`,
            },
          ]
        : []),
      ...(highest
        ? [
            {
              label: 'Highest cost scenario',
              value: `${highest.config.label} · ${inr(highest.estimatedTotal)}`,
            },
          ]
        : []),
      {
        label: 'Max absolute difference',
        value: inr(result.highlights.maxAbsoluteDifference),
      },
      ...result.highlights.largestCostDrivers.slice(0, 5).map((d) => ({
        label: `Driver · ${d.scenarioLabel}`,
        value: `${d.driverLabel} · ${inr(d.amount)}`,
      })),
    ],
    methodology: { versionLabel: result.version },
    disclaimer: result.disclaimer || DEFAULT_CONSTRUCTION_REPORT_DISCLAIMER,
  };
}
