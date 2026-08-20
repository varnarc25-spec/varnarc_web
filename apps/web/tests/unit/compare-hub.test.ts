import { describe, expect, it } from 'vitest';
import {
  builderCompareHref,
  classifyComparisonText,
  looksUnlikeForLike,
  loanGroupKey,
  parseVsTitle,
} from '@/lib/compare-hub';

describe('compare hub helpers', () => {
  it('parses vs titles', () => {
    expect(parseVsTitle('SBI Home Loan vs HDFC Home Loan')).toEqual({
      a: 'SBI Home Loan',
      b: 'HDFC Home Loan',
    });
  });

  it('rejects unlike-for-like construction pairs', () => {
    expect(looksUnlikeForLike('OPC 53 Cement', 'TMT Fe500D Steel')).toBe(true);
    expect(looksUnlikeForLike('OPC 43 Cement', 'OPC 53 Cement')).toBe(false);
  });

  it('classifies comparison text', () => {
    expect(classifyComparisonText('HDFC Home Loan vs SBI Home Loan')).toBe('finance');
    expect(classifyComparisonText('Hyundai Creta vs Kia Seltos')).toBe('cars');
    expect(classifyComparisonText('TOPCon vs Mono PERC')).toBe('solar');
  });

  it('groups loans by compatible type', () => {
    expect(loanGroupKey('HOME_LOAN')).toBe('loan:home');
    expect(loanGroupKey('personal')).toBe('loan:personal');
  });

  it('builds like-for-like compare URLs', () => {
    expect(builderCompareHref('cars', 'a', 'b', 'suv')).toContain('/automobile/compare?ids=');
    expect(builderCompareHref('finance', 'a', 'b', 'loan:home')).toContain('type=loans');
    expect(builderCompareHref('finance', 'a', 'b', 'card:credit')).toContain('type=credit-cards');
  });
});
