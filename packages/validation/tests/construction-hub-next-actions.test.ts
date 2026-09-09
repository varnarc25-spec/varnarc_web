import { describe, expect, it } from 'vitest';
import { resolveConstructionHubNextActions } from '../src/construction-hub-next-actions';

const guest = {
  hasEstimate: false,
  hasMaterials: false,
  hasBoq: false,
  hasSavedProject: false,
  isAuthenticated: false,
};

describe('resolveConstructionHubNextActions', () => {
  it('shows the four discovery cards for a guest with no calculation', () => {
    const cards = resolveConstructionHubNextActions(guest);
    expect(cards.map((c) => c.id)).toEqual(['compare', 'prices', 'professionals', 'save']);
    expect(cards.find((c) => c.id === 'save')?.href).toContain('/auth/login');
    expect(cards.find((c) => c.id === 'compare')?.description).toContain('OPC vs PPC');
  });

  it('recommends material quantities after a cost estimate', () => {
    const cards = resolveConstructionHubNextActions({ ...guest, hasEstimate: true });
    expect(cards.map((c) => c.id)).toEqual(['materials', 'compare', 'prices', 'save']);
  });

  it('recommends BOQ after material quantities', () => {
    const cards = resolveConstructionHubNextActions({
      ...guest,
      hasEstimate: true,
      hasMaterials: true,
    });
    expect(cards.map((c) => c.id)).toEqual(['boq', 'compare', 'prices', 'save']);
  });

  it('recommends price check and supplier quotes after a BOQ', () => {
    const cards = resolveConstructionHubNextActions({
      hasEstimate: true,
      hasMaterials: true,
      hasBoq: true,
      hasSavedProject: false,
      isAuthenticated: true,
    });
    expect(cards.map((c) => c.id)).toEqual(['prices', 'suppliers', 'professionals', 'save']);
  });

  it('shows Manage project when a project is already saved', () => {
    const cards = resolveConstructionHubNextActions({
      ...guest,
      isAuthenticated: true,
      hasSavedProject: true,
      projectId: 'abc',
    });
    expect(cards.find((c) => c.id === 'manage')?.href).toBe('/construction/project/abc');
    expect(cards.map((c) => c.id)).not.toContain('save');
  });
});
