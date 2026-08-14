import { describe, expect, it } from 'vitest';
import {
  applyCalculatorParamsToFieldValues,
  buildCalculatorHref,
  buildShareableCalculatorUrl,
  calculatorCanonicalPath,
  calculatorContextNotice,
  calculatorParamsFromFieldValues,
  hasCalculatorQueryParams,
  parseCalculatorParams,
  sanitizeAmount,
  sanitizeRate,
  sanitizeTenure,
  serializeCalculatorParams,
} from '@/lib/calculator-query';
import { parseEmiQuery, serializeEmiQuery } from '@/lib/emi-query';

describe('calculator query sanitizers', () => {
  it('sanitizes amount within bounds', () => {
    expect(sanitizeAmount(500000)).toBe(500000);
    expect(sanitizeAmount('250000.9')).toBe(250001);
    expect(sanitizeAmount(0)).toBeNull();
    expect(sanitizeAmount(-10)).toBeNull();
    expect(sanitizeAmount('abc')).toBeNull();
    expect(sanitizeAmount(null)).toBeNull();
  });

  it('allows zero rate and rejects negatives', () => {
    expect(sanitizeRate(0)).toBe(0);
    expect(sanitizeRate('10.55')).toBe(10.55);
    expect(sanitizeRate(-1)).toBeNull();
    expect(sanitizeRate('nope')).toBeNull();
  });

  it('sanitizes tenure for months and years', () => {
    expect(sanitizeTenure(5, 'years')).toEqual({
      tenure: 5,
      tenureUnit: 'years',
      tenureMonths: 60,
    });
    expect(sanitizeTenure(36, 'months')).toEqual({
      tenure: 36,
      tenureUnit: 'months',
      tenureMonths: 36,
    });
    expect(sanitizeTenure(0, 'years')).toBeNull();
    expect(sanitizeTenure(-3, 'months')).toBeNull();
  });
});

describe('parseCalculatorParams / serializeCalculatorParams', () => {
  it('parses standard EMI query keys', () => {
    const parsed = parseCalculatorParams({
      amount: '500000',
      rate: '10.5',
      tenure: '5',
      tenureUnit: 'years',
      product: 'hdfc-car-loan',
      lender: 'hdfc',
      category: 'car-loan',
    });
    expect(parsed.amount).toBe(500000);
    expect(parsed.rate).toBe(10.5);
    expect(parsed.tenure).toBe(5);
    expect(parsed.tenureUnit).toBe('years');
    expect(parsed.tenureMonths).toBe(60);
    expect(parsed.product).toBe('hdfc-car-loan');
    expect(parsed.lender).toBe('hdfc');
    expect(parsed.category).toBe('car-loan');
    expect(parsed.missing.amount).toBe(false);
  });

  it('ignores malformed values and disallowed private/filter keys', () => {
    const parsed = parseCalculatorParams({
      amount: 'not-a-number',
      rate: '-2',
      tenure: '0',
      income: '90000',
      creditScore: '780',
      employmentType: 'salaried',
      amountMin: '999999',
      tenureMin: '24',
      productName: 'Should Be Ignored',
      product: 'Bad Product!!',
    });
    expect(parsed.amount).toBeNull();
    expect(parsed.rate).toBeNull();
    expect(parsed.tenure).toBeNull();
    expect(parsed.product).toBeNull();
    expect(parsed.missing.amount).toBe(true);
  });

  it('does not crash on empty/malformed URLSearchParams', () => {
    expect(() => parseCalculatorParams(new URLSearchParams('&&&'))).not.toThrow();
    expect(parseCalculatorParams({})).toMatchObject({
      amount: null,
      rate: null,
      tenure: null,
    });
  });

  it('serializes only safe shareable keys', () => {
    const qs = serializeCalculatorParams({
      amount: 500000,
      rate: 10.5,
      tenure: 5,
      tenureUnit: 'years',
      product: 'hdfc-car-loan',
      lender: 'hdfc',
      category: 'car-loan',
    });
    expect(qs.toString()).toBe(
      'amount=500000&rate=10.5&tenure=5&tenureUnit=years&product=hdfc-car-loan&lender=hdfc&category=car-loan',
    );
    expect(qs.has('income')).toBe(false);
    expect(qs.has('productName')).toBe(false);
  });

  it('builds calculator hrefs and clean canonicals', () => {
    expect(
      buildCalculatorHref('emi', {
        amount: 500000,
        rate: 10.5,
        tenure: 5,
        tenureUnit: 'years',
      }),
    ).toBe('/calculators/emi?amount=500000&rate=10.5&tenure=5&tenureUnit=years');
    expect(
      buildCalculatorHref('personal-loan-emi', {
        amount: 500000,
        rate: 10.5,
        tenure: 5,
        tenureUnit: 'years',
      }),
    ).toBe('/calculators/personal-loan-emi?amount=500000&rate=10.5&tenure=5&tenureUnit=years');
    expect(calculatorCanonicalPath('emi')).toBe('/calculators/emi');
    expect(hasCalculatorQueryParams({ amount: '1' })).toBe(true);
    expect(hasCalculatorQueryParams({})).toBe(false);
  });

  it('maps params onto calculator field keys without inventing values', () => {
    const fields = [{ key: 'loanAmount' }, { key: 'annualRate' }, { key: 'tenureMonths' }];
    const applied = applyCalculatorParamsToFieldValues(
      fields,
      parseCalculatorParams({ amount: '200000', rate: '9.1', tenure: '3', tenureUnit: 'years' }),
      { loanAmount: '1', annualRate: '1', tenureMonths: '12' },
    );
    expect(applied.loanAmount).toBe('200000');
    expect(applied.annualRate).toBe('9.1');
    expect(applied.tenureMonths).toBe('36');

    const untouched = applyCalculatorParamsToFieldValues(fields, parseCalculatorParams({}), {
      loanAmount: '1',
      annualRate: '1',
      tenureMonths: '12',
    });
    expect(untouched).toEqual({ loanAmount: '1', annualRate: '1', tenureMonths: '12' });
  });

  it('builds shareable URLs from field values without private inputs', () => {
    const url = buildShareableCalculatorUrl(
      'emi',
      {
        principal: '500000',
        annualRate: '10.5',
        tenureMonths: '60',
        income: '90000',
      },
      'https://varnarc.com',
      { product: 'hdfc-car-loan' },
    );
    expect(url).toBe(
      'https://varnarc.com/calculators/emi?amount=500000&rate=10.5&tenure=5&tenureUnit=years&product=hdfc-car-loan',
    );
    expect(url).not.toContain('income');
  });

  it('builds contextual product notice from slug', () => {
    const notice = calculatorContextNotice(
      parseCalculatorParams({ product: 'hdfc-car-loan', rate: '9.1' }),
    );
    expect(notice).toContain("Hdfc Car Loan's displayed starting rate");
  });

  it('round-trips field extraction for sharing', () => {
    const state = calculatorParamsFromFieldValues({
      loanAmount: '100000',
      annualRate: '0',
      tenureMonths: '18',
    });
    expect(state.amount).toBe(100000);
    expect(state.rate).toBe(0);
    expect(state.tenure).toBe(18);
    expect(state.tenureUnit).toBe('months');
  });
});

describe('emi-query compatibility wrappers', () => {
  it('applies interactive defaults while ignoring catalog filters', () => {
    const parsed = parseEmiQuery({
      amountMin: '999999',
      amount: 'bad',
      rate: '-1',
    } as Record<string, string>);
    expect(parsed.usedDefaults.amount).toBe(true);
    expect(parsed.amount).toBe(5_00_000);
    expect(parsed.productId).toBeNull();
  });

  it('serializes product slug instead of productName', () => {
    const qs = serializeEmiQuery({
      amount: 100000,
      rate: 9,
      tenure: 2,
      tenureUnit: 'years',
      product: 'sbi-personal-loan',
    });
    expect(qs.get('product')).toBe('sbi-personal-loan');
    expect(qs.has('productName')).toBe(false);
  });
});
