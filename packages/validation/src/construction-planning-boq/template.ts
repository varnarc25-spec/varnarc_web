import { PLANNING_BOQ_SECTIONS, type BoqItem, type PlanningBoqSectionId } from './types';

const ENTER_QTY =
  'Enter quantity from drawings or a qualified professional. Not a structural take-off.';

export function planningBoqTemplateItems(): BoqItem[] {
  const rows: Array<Omit<BoqItem, 'id' | 'isIncluded' | 'source' | 'isCustom'>> = [
    {
      sectionId: 'civil',
      code: 'CIV-01',
      description: 'Site clearance',
      unit: 'lump_sum',
      quantity: 0,
      rate: 0,
      notes: ENTER_QTY,
    },
    {
      sectionId: 'civil',
      code: 'CIV-02',
      description: 'Excavation for foundation',
      unit: 'm3',
      quantity: 0,
      rate: 0,
      notes: ENTER_QTY,
    },
    {
      sectionId: 'rcc',
      code: 'RCC-01',
      description: 'PCC 1:4:8',
      unit: 'm3',
      quantity: 0,
      rate: 0,
      notes: ENTER_QTY,
    },
    {
      sectionId: 'rcc',
      code: 'RCC-02',
      description: 'RCC M20',
      unit: 'm3',
      quantity: 0,
      rate: 0,
      notes: ENTER_QTY,
    },
    {
      sectionId: 'rcc',
      code: 'RCC-03',
      description: 'Steel reinforcement Fe500D',
      unit: 'kg',
      quantity: 0,
      rate: 0,
      notes: ENTER_QTY,
    },
    {
      sectionId: 'masonry',
      code: 'MAS-01',
      description: 'Brick/AAC masonry',
      unit: 'nos',
      quantity: 0,
      rate: 0,
      notes: ENTER_QTY,
    },
    {
      sectionId: 'masonry',
      code: 'MAS-02',
      description: 'Internal plaster',
      unit: 'm2',
      quantity: 0,
      rate: 0,
      notes: ENTER_QTY,
    },
    {
      sectionId: 'masonry',
      code: 'MAS-03',
      description: 'External plaster',
      unit: 'm2',
      quantity: 0,
      rate: 0,
      notes: ENTER_QTY,
    },
    {
      sectionId: 'flooring',
      code: 'FLR-01',
      description: 'Flooring',
      unit: 'sqft',
      quantity: 0,
      rate: 0,
      notes: ENTER_QTY,
    },
    {
      sectionId: 'electrical',
      code: 'ELC-01',
      description: 'Electrical points',
      unit: 'sqft',
      quantity: 0,
      rate: 0,
      notes: ENTER_QTY,
    },
    {
      sectionId: 'plumbing',
      code: 'PLB-01',
      description: 'Plumbing',
      unit: 'sqft',
      quantity: 0,
      rate: 0,
      notes: ENTER_QTY,
    },
    {
      sectionId: 'painting',
      code: 'PNT-01',
      description: 'Painting',
      unit: 'liter',
      quantity: 0,
      rate: 0,
      notes: ENTER_QTY,
    },
    {
      sectionId: 'doors',
      code: 'DRW-01',
      description: 'Doors & windows (provisional)',
      unit: 'lump_sum',
      quantity: 0,
      rate: 0,
      notes: ENTER_QTY,
    },
    {
      sectionId: 'external',
      code: 'EXT-01',
      description: 'External works',
      unit: 'lump_sum',
      quantity: 0,
      rate: 0,
      notes: ENTER_QTY,
    },
  ];

  return rows.map((row, index) => ({
    ...row,
    id: `tpl-${row.code ?? index}`,
    isIncluded: true,
    source: 'template',
    isCustom: false,
  }));
}

export function sectionLabel(sectionId: PlanningBoqSectionId): string {
  return PLANNING_BOQ_SECTIONS.find((s) => s.id === sectionId)?.label ?? sectionId;
}

export function isPlanningBoqSectionId(value: string): value is PlanningBoqSectionId {
  return PLANNING_BOQ_SECTIONS.some((s) => s.id === value);
}
