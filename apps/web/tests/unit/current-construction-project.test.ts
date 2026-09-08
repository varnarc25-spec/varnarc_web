import { describe, expect, it } from 'vitest';
import {
  formatAreaLabel,
  formatQualityLabel,
  isMeaningfulWizardDraft,
  mapApiProjectToSnapshot,
  mapCostCalcStorageToSnapshot,
  parseLocationParts,
  pickCurrentConstructionProject,
} from '@/lib/construction/current-project';
import { defaultProjectWizardDraft } from '@/components/construction/project-wizard/draft';
import type { ConstructionProject } from '@/services/construction';

describe('parseLocationParts', () => {
  it('splits city and state', () => {
    expect(parseLocationParts('Bengaluru, Karnataka')).toEqual({
      location: 'Bengaluru, Karnataka',
      city: 'Bengaluru',
      state: 'Karnataka',
    });
  });
});

describe('format helpers', () => {
  it('formats Indian area and quality', () => {
    expect(formatAreaLabel(1500, 'sqft')).toBe('1,500 sq ft');
    expect(formatQualityLabel('standard')).toBe('Standard');
  });
});

describe('mapCostCalcStorageToSnapshot', () => {
  it('ignores unsaved default calculator state', () => {
    expect(
      mapCostCalcStorageToSnapshot({
        form: { location: 'Hyderabad', builtUpArea: '1500' },
      }),
    ).toBeNull();
  });

  it('maps a saved calculator run', () => {
    const snap = mapCostCalcStorageToSnapshot({
      savedAt: 1_700_000_000_000,
      lastTotal: 3088800,
      form: {
        location: 'Bengaluru, Karnataka',
        builtUpArea: '1500',
        floors: '2',
        quality: 'standard',
        propertyType: 'independent_house',
      },
    });
    expect(snap?.name).toBe('My construction project');
    expect(snap?.city).toBe('Bengaluru');
    expect(snap?.state).toBe('Karnataka');
    expect(snap?.builtUpArea).toBe(1500);
    expect(snap?.floors).toBe(2);
    expect(snap?.persistence).toBe('local-cost');
    expect(snap?.estimatedCost).toBeGreaterThan(0);
    expect(snap?.materialCost).toBeGreaterThan(0);
    expect(snap?.labourCost).toBeGreaterThan(0);
  });
});

describe('isMeaningfulWizardDraft', () => {
  it('requires a saved timestamp', () => {
    expect(isMeaningfulWizardDraft(defaultProjectWizardDraft())).toBe(false);
    expect(
      isMeaningfulWizardDraft({
        ...defaultProjectWizardDraft(),
        savedAt: Date.now(),
        name: 'My Dream Home',
      }),
    ).toBe(true);
  });
});

describe('pickCurrentConstructionProject', () => {
  const older: ConstructionProject = {
    id: 'aaa',
    name: 'Older',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
  const newer: ConstructionProject = {
    id: 'bbb',
    name: 'My Dream Home',
    region: 'Bengaluru, Karnataka',
    areaSqft: 1500,
    quality: 'standard',
    estimatedCost: 3088800,
    breakdown: { materialCost: 1482624, labourCost: 989216 },
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('prefers last selected cloud project', () => {
    const result = pickCurrentConstructionProject({
      serverProjects: [older, newer],
      lastSelectedId: 'aaa',
      wizard: null,
      costCalc: null,
    });
    expect(result.status).toBe('ready');
    if (result.status === 'ready') expect(result.project.id).toBe('aaa');
  });

  it('falls back to most recently updated cloud project', () => {
    const result = pickCurrentConstructionProject({
      serverProjects: [older, newer],
      lastSelectedId: null,
      wizard: null,
      costCalc: null,
    });
    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.project.name).toBe('My Dream Home');
      expect(result.project.materialCost).toBe(1482624);
      expect(result.project.labourCost).toBe(989216);
    }
  });

  it('uses local cost data when there is no cloud project', () => {
    const result = pickCurrentConstructionProject({
      serverProjects: [],
      lastSelectedId: null,
      wizard: null,
      costCalc: {
        savedAt: Date.now(),
        form: { location: 'Hyderabad', builtUpArea: '1200', floors: '1', quality: 'basic' },
      },
    });
    expect(result.status).toBe('ready');
    if (result.status === 'ready') expect(result.project.persistence).toBe('local-cost');
  });

  it('returns empty when nothing is stored', () => {
    expect(
      pickCurrentConstructionProject({
        serverProjects: [],
        lastSelectedId: null,
        wizard: null,
        costCalc: null,
      }).status,
    ).toBe('empty');
  });
});

describe('mapApiProjectToSnapshot', () => {
  it('maps region and costs without inventing a second store', () => {
    const snap = mapApiProjectToSnapshot({
      id: 'p1',
      name: 'My Dream Home',
      region: 'Bengaluru, Karnataka',
      areaSqft: 1500,
      quality: 'standard',
      estimatedCost: 3088800,
      breakdown: {
        source: 'project-wizard',
        builtUpAreaSqft: 1500,
        floors: 2,
        materialCost: 1482624,
        labourCost: 989216,
      },
    });
    expect(snap.city).toBe('Bengaluru');
    expect(snap.floors).toBe(2);
    expect(snap.builtUpArea).toBe(1500);
    expect(snap.editHref).toBe('/construction/project/p1');
  });
});
