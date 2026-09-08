import { describe, expect, it } from 'vitest';
import {
  calculateDetailedEstimate,
  classifyRateFreshness,
  requiredLabourDays,
  workItemMaterialQuantity,
  parseRateImportCsv,
  RATE_IMPORT_CSV_HEADER,
  DEFAULT_COMMERCIAL_RULES,
  QUALITY_SPECIFICATIONS,
  WORK_ITEM_PLANNING_RESOURCES,
  PRODUCTIVITY_NORMS,
} from '../src';

describe('detailed BOQ engine', () => {
  it('applies wastage and productivity', () => {
    expect(workItemMaterialQuantity(10, 0.4, 5)).toBeCloseTo(4.2);
    expect(requiredLabourDays(100, 20)).toBe(5);
  });

  it('returns a cost range with contingency', () => {
    const result = calculateDetailedEstimate({
      workQuantity: 10,
      labourOutputPerDay: 5,
      contingencyPercent: 10,
      overheadPercent: 8,
      profitPercent: 10,
      professionalFeePercent: 4,
      resources: [
        {
          resourceType: 'MATERIAL',
          resourceKey: 'cement',
          quantityCoefficient: 8,
          wastagePercent: 3,
          unit: 'bag',
          rate: 380,
          minRate: 350,
          maxRate: 410,
        },
        {
          resourceType: 'LABOUR',
          resourceKey: 'mason',
          quantityCoefficient: 1,
          wastagePercent: 0,
          unit: 'day',
          rate: 900,
          minRate: 800,
          maxRate: 1000,
        },
      ],
    });
    expect(result.total.low).toBeLessThan(result.total.expected);
    expect(result.total.high).toBeGreaterThan(result.total.expected);
    expect(result.material.expected).toBeGreaterThan(0);
    expect(result.labour.expected).toBeGreaterThan(0);
  });
});

describe('rate freshness and CSV import', () => {
  it('marks missing verification as critical', () => {
    expect(classifyRateFreshness(null)).toBe('CRITICAL');
    expect(classifyRateFreshness(new Date())).toBe('FRESH');
  });

  it('rejects inverted bands in CSV', () => {
    const csv = `${RATE_IMPORT_CSV_HEADER}
Cement,OPC 43,,Karnataka,,Bengaluru,500,400,300,50kg bag,CPWD,2024-01-01,2024-01-01,HIGH`;
    const parsed = parseRateImportCsv(csv);
    expect(parsed.rows).toHaveLength(0);
    expect(parsed.errors[0]?.messages.join(' ')).toMatch(/minRate|averageRate/i);
  });

  it('accepts a valid row', () => {
    const csv = `${RATE_IMPORT_CSV_HEADER}
Cement,OPC 43,,Karnataka,,Bengaluru,350,380,410,50kg bag,State survey,2024-01-01,2024-06-01,MEDIUM`;
    const parsed = parseRateImportCsv(csv);
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.rows[0]?.average).toBe(380);
  });
});

describe('intelligence catalogs', () => {
  it('maps quality specs and commercial rules without inventing tax', () => {
    expect(QUALITY_SPECIFICATIONS.STANDARD.length).toBeGreaterThan(0);
    expect(QUALITY_SPECIFICATIONS.ECONOMY.length).toBeGreaterThan(0);
    const tax = DEFAULT_COMMERCIAL_RULES.find((r) => r.kind === 'TAX');
    expect(tax?.percent).toBe(0);
    const escalation = DEFAULT_COMMERCIAL_RULES.find((r) => r.kind === 'ESCALATION');
    expect(escalation?.indexFactor).toBe(1);
    expect(WORK_ITEM_PLANNING_RESOURCES.length).toBeGreaterThan(0);
    expect(PRODUCTIVITY_NORMS.length).toBeGreaterThan(0);
  });
});
