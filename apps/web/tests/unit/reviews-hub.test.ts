import { describe, expect, it } from 'vitest';
import { classifyReview, parseEditorialScore } from '@/lib/reviews-hub';
import type { ReviewListItem } from '@/services/content';

function review(partial: Partial<ReviewListItem>): ReviewListItem {
  return {
    id: '1',
    title: 'Sample',
    slug: 'sample',
    overallScore: null,
    ...partial,
  };
}

describe('reviews hub helpers', () => {
  it('formats editorial scores on the inferred scale', () => {
    expect(parseEditorialScore(4.5)).toEqual({
      value: 4.5,
      max: 5,
      label: 'Varnarc Editorial Rating',
    });
    expect(parseEditorialScore(8.2)?.max).toBe(10);
    expect(parseEditorialScore(null)).toBeNull();
  });

  it('classifies reviews from entity type and text', () => {
    expect(classifyReview(review({ title: 'HDFC Credit Card review' }))).toBe('finance');
    expect(classifyReview(review({ slug: 'hyundai-creta-review' }))).toBe('automobile');
    expect(classifyReview(review({ title: 'TOPCon solar panel review' }))).toBe('solar');
  });
});
