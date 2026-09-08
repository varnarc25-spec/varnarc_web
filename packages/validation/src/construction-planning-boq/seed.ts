import { calculateMaterialQuantities } from '../material-quantity-calculator';
import type { ConstructionPlannerHandoff } from '../construction-planner-handoff';
import { PLANNING_BOQ_DISCLAIMER } from './types';
import { planningBoqTemplateItems } from './template';
import type { Boq, BoqItem, PlanningBoqSectionId } from './types';

const MATERIAL_TO_CODE: Record<string, string> = {
  steel: 'RCC-03',
  masonry: 'MAS-01',
  tiles: 'FLR-01',
  electrical: 'ELC-01',
  plumbing: 'PLB-01',
  paint: 'PNT-01',
};

const MATERIAL_EXTRA: Record<string, { sectionId: PlanningBoqSectionId; description: string }> = {
  cement: { sectionId: 'rcc', description: 'Cement (planning quantity)' },
  sand: { sectionId: 'rcc', description: 'Sand (planning quantity)' },
  aggregate: { sectionId: 'rcc', description: 'Aggregate (planning quantity)' },
};

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function applyMaterialLine(
  items: BoqItem[],
  line: { id: string; label: string; quantity: number; unit: string; rate: number },
): BoqItem[] {
  const code = MATERIAL_TO_CODE[line.id];
  const note = `Planning quantity from Material Quantity Calculator (${line.label}). ${PLANNING_BOQ_DISCLAIMER}`;
  if (code) {
    return items.map((item) =>
      item.code === code
        ? {
            ...item,
            quantity: line.quantity,
            unit: line.unit,
            rate: line.rate,
            source: 'material_quantity',
            notes: note,
          }
        : item,
    );
  }
  const extra = MATERIAL_EXTRA[line.id];
  if (!extra) return items;
  return [
    ...items,
    {
      id: newId(`mq-${line.id}`),
      sectionId: extra.sectionId,
      code: `MQ-${line.id.toUpperCase()}`,
      description: extra.description,
      unit: line.unit,
      quantity: line.quantity,
      rate: line.rate,
      isIncluded: true,
      source: 'material_quantity',
      notes: note,
      isCustom: false,
    },
  ];
}

export function createPlanningBoq(input?: {
  title?: string;
  notes?: string;
  contingencyPercent?: number;
  includeTax?: boolean;
  taxPercent?: number | null;
  handoff?: ConstructionPlannerHandoff;
}): Boq {
  const handoff = input?.handoff ?? {};
  let items = planningBoqTemplateItems();

  if (handoff.builtUpArea && handoff.builtUpArea > 0) {
    try {
      const quality =
        handoff.quality === 'basic' || handoff.quality === 'premium' || handoff.quality === 'luxury'
          ? handoff.quality
          : 'standard';
      const qty = calculateMaterialQuantities({
        builtUpArea: handoff.builtUpArea,
        areaUnit: handoff.areaUnit === 'sqm' ? 'sqm' : 'sqft',
        floors: handoff.floors && handoff.floors > 0 ? Math.round(handoff.floors) : 1,
        quality,
        location: handoff.location || 'India',
        structureType:
          handoff.structureType === 'load_bearing' || handoff.structureType === 'steel'
            ? handoff.structureType
            : 'rcc_framed',
        foundationType:
          handoff.foundationType === 'raft' ||
          handoff.foundationType === 'pile' ||
          handoff.foundationType === 'combined'
            ? handoff.foundationType
            : 'isolated',
      });
      for (const line of qty.lines) {
        items = applyMaterialLine(items, line);
      }
    } catch {
      /* keep empty template quantities */
    }
  }

  return {
    id: newId('boq'),
    title: input?.title?.trim() || 'Planning BOQ',
    currency: 'INR',
    notes: input?.notes?.trim() || PLANNING_BOQ_DISCLAIMER,
    contingencyPercent: input?.contingencyPercent ?? 5,
    includeTax: Boolean(input?.includeTax),
    taxPercent: input?.taxPercent ?? null,
    items,
    location: handoff.location,
    builtUpArea: handoff.builtUpArea,
    areaUnit: handoff.areaUnit,
    floors: handoff.floors,
    quality: handoff.quality,
  };
}

export function addCustomBoqItem(boq: Boq, sectionId: PlanningBoqSectionId): Boq {
  return {
    ...boq,
    items: [
      ...boq.items,
      {
        id: newId('custom'),
        sectionId,
        description: 'Custom item',
        unit: 'nos',
        quantity: 0,
        rate: 0,
        isIncluded: true,
        source: 'custom',
        notes: '',
        isCustom: true,
      },
    ],
  };
}

export function duplicateBoqItem(boq: Boq, itemId: string): Boq {
  const index = boq.items.findIndex((item) => item.id === itemId);
  if (index < 0) return boq;
  const source = boq.items[index]!;
  const copy: BoqItem = {
    ...source,
    id: newId('dup'),
    description: `${source.description} (copy)`,
    source: 'custom',
    isCustom: true,
  };
  const items = [...boq.items];
  items.splice(index + 1, 0, copy);
  return { ...boq, items };
}

export function removeBoqItem(boq: Boq, itemId: string): Boq {
  const item = boq.items.find((row) => row.id === itemId);
  if (!item?.isCustom) return boq;
  return { ...boq, items: boq.items.filter((row) => row.id !== itemId) };
}

export function patchBoqItem(boq: Boq, itemId: string, patch: Partial<BoqItem>): Boq {
  return {
    ...boq,
    items: boq.items.map((item) =>
      item.id === itemId ? { ...item, ...patch, id: item.id } : item,
    ),
  };
}
