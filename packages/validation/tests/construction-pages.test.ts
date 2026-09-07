import { describe, expect, it } from 'vitest';
import {
  CONSTRUCTION_CMS_PAGE_DEFAULTS,
  constructionPageKeySchema,
  updateConstructionPageSeoSchema,
} from '../src/construction-pages';

describe('construction page SEO', () => {
  it('publishes the construction home page key', () => {
    expect(constructionPageKeySchema.parse('hub')).toBe('hub');
    expect(CONSTRUCTION_CMS_PAGE_DEFAULTS.hub.path).toBe('/construction');
  });

  it('accepts a media-library hero image', () => {
    const parsed = updateConstructionPageSeoSchema.parse({
      heroImageUrl: 'https://cdn.example.com/construction-hero.jpg',
      heroImageMediaId: 'c0000001-0000-4000-8000-000000000099',
      heroImageAlt: 'House under construction',
      heroImageWidth: 320,
    });
    expect(parsed.heroImageWidth).toBe(320);
    expect(parsed.heroImageUrl).toContain('construction-hero');
  });
});
