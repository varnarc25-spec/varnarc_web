export const PLANNING_BOQ_VERSION = '2026.09.1';

export const PLANNING_BOQ_DISCLAIMER =
  'Planning BOQ only. Final structural quantities and specifications must be verified by qualified professionals.';

export const PLANNING_BOQ_SECTIONS = [
  { id: 'civil', label: 'Civil' },
  { id: 'rcc', label: 'RCC & Structure' },
  { id: 'masonry', label: 'Masonry' },
  { id: 'flooring', label: 'Flooring' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'painting', label: 'Painting' },
  { id: 'doors', label: 'Doors & Windows' },
  { id: 'external', label: 'External Works' },
] as const;

export type PlanningBoqSectionId = (typeof PLANNING_BOQ_SECTIONS)[number]['id'];

export type BoqItemSource = 'template' | 'material_quantity' | 'custom' | 'saved';

export type BoqSection = {
  id: PlanningBoqSectionId;
  label: string;
};

export type BoqItem = {
  id: string;
  sectionId: PlanningBoqSectionId;
  code?: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  isIncluded: boolean;
  source: BoqItemSource;
  notes: string;
  isCustom: boolean;
};

export type Boq = {
  id: string;
  title: string;
  currency: 'INR';
  notes: string;
  contingencyPercent: number;
  includeTax: boolean;
  taxPercent: number | null;
  items: BoqItem[];
  location?: string;
  builtUpArea?: number;
  areaUnit?: 'sqft' | 'sqm';
  floors?: number;
  quality?: string;
};

export type BoqSectionTotal = {
  sectionId: PlanningBoqSectionId;
  label: string;
  amount: number;
  includedCount: number;
  itemCount: number;
};

export type PlanningBoqTotals = {
  items: Array<BoqItem & { amount: number; status: 'included' | 'excluded' }>;
  sectionSubtotals: BoqSectionTotal[];
  subtotal: number;
  contingencyPercent: number;
  contingencyAmount: number;
  taxPercent: number | null;
  taxAmount: number | null;
  grandTotal: number;
  disclaimer: string;
  version: string;
};
