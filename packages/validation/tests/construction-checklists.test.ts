import { describe, expect, it } from 'vitest';
import {
  CANONICAL_CONSTRUCTION_CHECKLISTS,
  CONSTRUCTION_CHECKLIST_QUALIFICATION,
  normalizeChecklistItems,
  summarizeChecklistProgress,
} from '../src/construction-checklists';

describe('construction checklists', () => {
  it('includes all required initial phases', () => {
    const titles = CANONICAL_CONSTRUCTION_CHECKLISTS.map((c) => c.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        'Before construction',
        'Site preparation',
        'Foundation',
        'RCC',
        'Masonry',
        'Electrical',
        'Plumbing',
        'Waterproofing',
        'Painting',
        'Pre-handover',
        'House handover',
      ]),
    );
    expect(CANONICAL_CONSTRUCTION_CHECKLISTS).toHaveLength(11);
  });

  it('normalizes legacy label items and string items', () => {
    const items = normalizeChecklistItems(
      ['Plain string', { label: 'Legacy', phase: 'Foundation', professionalReviewRequired: true }],
      'General',
    );
    expect(items[0]?.title).toBe('Plain string');
    expect(items[1]?.title).toBe('Legacy');
    expect(items[1]?.professionalReviewRequired).toBe(true);
  });

  it('summarizes progress without claiming compliance', () => {
    const checklist = CANONICAL_CONSTRUCTION_CHECKLISTS[0]!;
    const summary = summarizeChecklistProgress({
      items: checklist.items,
      progress: {
        [checklist.items[0]!.id]: { completed: true, notes: 'ok' },
      },
    });
    expect(summary.completed).toBe(1);
    expect(summary.percentComplete).toBeGreaterThan(0);
    expect(CONSTRUCTION_CHECKLIST_QUALIFICATION.toLowerCase()).toContain('does not certify');
  });
});
