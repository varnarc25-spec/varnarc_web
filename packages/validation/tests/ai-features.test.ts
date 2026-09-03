import { describe, expect, it } from 'vitest';
import { generateImageMetadataSchema } from '../src/ai-features';

describe('generateImageMetadataSchema', () => {
  it('accepts calculator context and defaults the locale', () => {
    const parsed = generateImageMetadataSchema.parse({
      title: 'Car Loan EMI Calculator',
      content: 'Calculate monthly car loan repayments.',
      imageUrl: 'https://storage.googleapis.com/example/car.webp',
      entityType: 'calculator',
    });

    expect(parsed.locale).toBe('en-IN');
    expect(parsed.entityType).toBe('calculator');
  });

  it('rejects invalid image URLs', () => {
    expect(() =>
      generateImageMetadataSchema.parse({
        title: 'Car Loan EMI Calculator',
        imageUrl: 'not-a-url',
      }),
    ).toThrow();
  });
});
