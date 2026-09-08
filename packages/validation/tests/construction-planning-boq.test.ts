import { describe, expect, it } from 'vitest';
import {
  PLANNING_BOQ_DISCLAIMER,
  PLANNING_BOQ_SECTIONS,
  addCustomBoqItem,
  calculatePlanningBoq,
  createPlanningBoq,
  derivedItemAmount,
  removeBoqItem,
} from '../src/construction-planning-boq';

describe('planning BOQ totals', () => {
  it('derives amount from quantity × rate and ignores excluded items', () => {
    const boq = createPlanningBoq();
    boq.items = [
      {
        id: '1',
        sectionId: 'masonry',
        description: 'Brick/AAC masonry',
        unit: 'nos',
        quantity: 1000,
        rate: 8,
        isIncluded: true,
        source: 'custom',
        notes: '',
        isCustom: true,
      },
      {
        id: '2',
        sectionId: 'painting',
        description: 'Painting',
        unit: 'liter',
        quantity: 50,
        rate: 220,
        isIncluded: false,
        source: 'custom',
        notes: '',
        isCustom: true,
      },
      {
        id: '3',
        sectionId: 'flooring',
        description: 'Flooring',
        unit: 'sqft',
        quantity: 100,
        rate: 90,
        isIncluded: true,
        source: 'template',
        notes: '',
        isCustom: false,
      },
    ];
    boq.contingencyPercent = 10;
    boq.includeTax = false;

    expect(derivedItemAmount(boq.items[0]!)).toBe(8000);
    expect(derivedItemAmount(boq.items[1]!)).toBe(0);

    const totals = calculatePlanningBoq(boq);
    expect(totals.subtotal).toBe(17000);
    expect(totals.sectionSubtotals.find((s) => s.sectionId === 'masonry')?.amount).toBe(8000);
    expect(totals.sectionSubtotals.find((s) => s.sectionId === 'painting')?.amount).toBe(0);
    expect(totals.sectionSubtotals.find((s) => s.sectionId === 'flooring')?.amount).toBe(9000);
    expect(totals.contingencyAmount).toBe(1700);
    expect(totals.taxAmount).toBeNull();
    expect(totals.grandTotal).toBe(18700);
    expect(totals.disclaimer).toBe(PLANNING_BOQ_DISCLAIMER);
    expect(totals.sectionSubtotals).toHaveLength(PLANNING_BOQ_SECTIONS.length);
  });

  it('applies tax only when explicitly enabled', () => {
    const boq = createPlanningBoq({ includeTax: true, taxPercent: 18, contingencyPercent: 0 });
    boq.items = [
      {
        id: '1',
        sectionId: 'civil',
        description: 'Site clearance',
        unit: 'lump_sum',
        quantity: 1,
        rate: 10000,
        isIncluded: true,
        source: 'custom',
        notes: '',
        isCustom: true,
      },
    ];
    const totals = calculatePlanningBoq(boq);
    expect(totals.taxAmount).toBe(1800);
    expect(totals.grandTotal).toBe(11800);
  });

  it('seeds template sections without inventing structural quantities', () => {
    const empty = createPlanningBoq();
    expect(empty.items.every((item) => item.quantity === 0)).toBe(true);
    expect(empty.items.some((item) => item.description === 'RCC M20')).toBe(true);
    expect(empty.notes).toContain('Planning BOQ only');
  });

  it('can pull planning quantities from the material calculator engine', () => {
    const seeded = createPlanningBoq({
      handoff: {
        builtUpArea: 1500,
        areaUnit: 'sqft',
        floors: 2,
        quality: 'standard',
        location: 'Bengaluru',
      },
    });
    const steel = seeded.items.find((item) => item.code === 'RCC-03');
    expect(steel?.source).toBe('material_quantity');
    expect(steel?.quantity).toBeGreaterThan(0);
    expect(steel?.notes).toMatch(/Material Quantity Calculator/);
  });

  it('only deletes custom items', () => {
    let boq = createPlanningBoq();
    const templateId = boq.items[0]!.id;
    boq = removeBoqItem(boq, templateId);
    expect(boq.items.find((item) => item.id === templateId)).toBeTruthy();
    boq = addCustomBoqItem(boq, 'civil');
    const custom = boq.items.find((item) => item.isCustom)!;
    boq = removeBoqItem(boq, custom.id);
    expect(boq.items.find((item) => item.id === custom.id)).toBeFalsy();
  });
});
