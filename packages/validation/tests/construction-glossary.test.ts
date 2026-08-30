import { describe, expect, it } from 'vitest';

import {
  CONSTRUCTION_GLOSSARY_TERMS,
  buildConstructionGlossaryTermLanding,
  canIndexConstructionGlossaryTerm,
  listIndexableConstructionGlossaryTerms,
} from '../src/construction-glossary';

describe('construction-glossary', () => {
  it('indexes all curated initial terms', () => {
    const failed = CONSTRUCTION_GLOSSARY_TERMS.map((t) => ({
      slug: t.slug,
      ...canIndexConstructionGlossaryTerm(t.slug),
    })).filter((r) => !r.indexable);
    expect(failed).toEqual([]);
    expect(listIndexableConstructionGlossaryTerms().length).toBe(
      CONSTRUCTION_GLOSSARY_TERMS.length,
    );
  });

  it('rejects unknown slugs', () => {
    expect(canIndexConstructionGlossaryTerm('not-a-term').indexable).toBe(false);
  });

  it('builds a rich BOQ landing with related terms and actions', () => {
    const landing = buildConstructionGlossaryTermLanding('boq');
    expect(landing).not.toBeNull();
    expect(landing!.canonicalPath).toBe('/construction/glossary/boq');
    expect(landing!.technicalExplanation.length).toBeGreaterThan(220);
    expect(landing!.relatedTerms.length).toBeGreaterThan(0);
    expect(landing!.nextActions.length).toBeGreaterThan(0);
    expect(landing!.relatedCalculator?.href).toContain('boq');
  });

  it('links carpet / built-up / super built-up together', () => {
    const carpet = buildConstructionGlossaryTermLanding('carpet-area');
    expect(carpet!.relatedTermSlugs).toContain('built-up-area');
    expect(carpet!.relatedTermSlugs).toContain('super-built-up-area');
  });

  it('includes all requested initial terms', () => {
    const slugs = new Set(CONSTRUCTION_GLOSSARY_TERMS.map((t) => t.slug));
    for (const required of [
      'boq',
      'rcc',
      'pcc',
      'bbs',
      'tmt',
      'aac-block',
      'carpet-area',
      'built-up-area',
      'super-built-up-area',
      'plinth-area',
      'fsi',
      'far',
      'mortar',
      'aggregate',
      'formwork',
      'reinforcement',
    ]) {
      expect(slugs.has(required)).toBe(true);
    }
  });
});
