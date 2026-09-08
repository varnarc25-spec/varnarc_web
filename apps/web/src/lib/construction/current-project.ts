/**
 * Single normalized current-project snapshot.
 * Does not duplicate persistence — maps API projects, wizard draft, and cost-calculator storage.
 */

import { calculateConstructionCost } from '@varnarc/validation';
import type { ConstructionProject } from '@/services/construction';
import {
  labourCostFromProject,
  materialCostFromProject,
  toNum,
  wizardMeta,
} from '@/components/construction/project-dashboard/dashboard-metrics';
import {
  loadProjectWizardDraft,
  PROJECT_WIZARD_STORAGE_KEY,
  type ProjectWizardDraft,
} from '@/components/construction/project-wizard/draft';

export const COST_CALCULATOR_STORAGE_KEY = 'varnarc.construction.cost-calculator.v1';
export const CURRENT_CONSTRUCTION_PROJECT_ID_KEY = 'varnarc.construction.current-project-id.v1';

export type ConstructionProjectPersistence = 'cloud' | 'local-wizard' | 'local-cost';

/** Normalized current-project view used by the hub summary (not a second store). */
export type ConstructionProjectSnapshot = {
  id: string;
  userId?: string | null;
  name: string;
  location: string;
  city: string | null;
  state: string | null;
  builtUpArea: number | null;
  areaUnit: 'sqft' | 'sqm';
  floors: number | null;
  propertyType: string | null;
  constructionQuality: string | null;
  estimatedCost: number | null;
  materialCost: number | null;
  labourCost: number | null;
  contingency: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  persistence: ConstructionProjectPersistence;
  editHref: string;
};

export type CurrentProjectResolution =
  { status: 'empty' } | { status: 'ready'; project: ConstructionProjectSnapshot };

export function parseLocationParts(raw: string | null | undefined): {
  location: string;
  city: string | null;
  state: string | null;
} {
  const location = (raw ?? '').trim();
  if (!location) return { location: '', city: null, state: null };
  const parts = location
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { location, city: parts[0] ?? null, state: parts.slice(1).join(', ') };
  }
  return { location, city: parts[0] ?? null, state: null };
}

export function formatQualityLabel(quality: string | null | undefined): string | null {
  const q = (quality ?? '').trim();
  if (!q) return null;
  return q.charAt(0).toUpperCase() + q.slice(1).toLowerCase();
}

export function formatAreaLabel(area: number | null, unit: 'sqft' | 'sqm'): string {
  if (area == null || !Number.isFinite(area)) return '—';
  const n = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(area));
  return `${n} ${unit === 'sqm' ? 'sq m' : 'sq ft'}`;
}

export function rememberCurrentConstructionProjectId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENT_CONSTRUCTION_PROJECT_ID_KEY, id);
  } catch {
    /* ignore */
  }
}

export function readCurrentConstructionProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(CURRENT_CONSTRUCTION_PROJECT_ID_KEY);
  } catch {
    return null;
  }
}

function asQuality(value: string | null | undefined): 'basic' | 'standard' | 'premium' | 'luxury' {
  if (value === 'basic' || value === 'premium' || value === 'luxury') return value;
  return 'standard';
}

function estimateFromAssumptions(input: {
  location: string;
  propertyType?: string | null;
  builtUpArea: number | null;
  floors: number | null;
  quality: string | null;
}): {
  estimatedCost: number;
  materialCost: number;
  labourCost: number;
  contingency: number;
} | null {
  if (input.builtUpArea == null || input.builtUpArea <= 0) return null;
  const location = input.location.trim() || 'India';
  const propertyType =
    input.propertyType === 'renovation' ||
    input.propertyType === 'villa' ||
    input.propertyType === 'apartment' ||
    input.propertyType === 'duplex' ||
    input.propertyType === 'commercial'
      ? input.propertyType
      : 'independent_house';
  try {
    const result = calculateConstructionCost({
      location,
      propertyType,
      builtUpArea: input.builtUpArea,
      areaUnit: 'sqft',
      floors: Math.max(1, input.floors ?? 1),
      quality: asQuality(input.quality),
    });
    return {
      estimatedCost: result.estimatedTotal,
      materialCost: result.materialCost,
      labourCost: result.labourCost,
      contingency: result.contingencyAmount,
    };
  } catch {
    return null;
  }
}

export function mapApiProjectToSnapshot(project: ConstructionProject): ConstructionProjectSnapshot {
  const meta = wizardMeta(project);
  const loc = parseLocationParts(project.region);
  const builtUp = toNum(meta?.builtUpAreaSqft) ?? toNum(project.areaSqft);
  const floors = meta?.floors != null ? Number(meta.floors) : null;
  const estimated = toNum(project.estimatedCost);
  let material = materialCostFromProject(project);
  let labour = labourCostFromProject(project);
  let contingency: number | null = null;
  const rec =
    project.breakdown && !Array.isArray(project.breakdown) && typeof project.breakdown === 'object'
      ? (project.breakdown as Record<string, unknown>)
      : null;
  contingency = toNum(rec?.contingency as number | string | null | undefined);

  if ((material == null || labour == null) && builtUp != null) {
    const derived = estimateFromAssumptions({
      location: loc.location,
      propertyType: project.projectType,
      builtUpArea: builtUp,
      floors,
      quality: project.quality,
    });
    if (derived) {
      material = material ?? derived.materialCost;
      labour = labour ?? derived.labourCost;
      contingency = contingency ?? derived.contingency;
    }
  }

  return {
    id: project.id,
    name: project.name?.trim() || 'Untitled project',
    location: loc.location,
    city: loc.city,
    state: loc.state,
    builtUpArea: builtUp,
    areaUnit: 'sqft',
    floors: Number.isFinite(floors) ? floors : null,
    propertyType: project.projectType ?? meta?.projectTypeKey ?? null,
    constructionQuality: project.quality ?? null,
    estimatedCost: estimated,
    materialCost: material,
    labourCost: labour,
    contingency,
    createdAt: project.createdAt ?? null,
    updatedAt: project.updatedAt ?? null,
    persistence: 'cloud',
    editHref: `/construction/project/${project.id}`,
  };
}

export function isMeaningfulWizardDraft(draft: ProjectWizardDraft | null): boolean {
  if (!draft) return false;
  if (draft.savedAt == null) return false;
  return Boolean(draft.name.trim() || draft.location.trim() || Number(draft.builtUpAreaSqft) > 0);
}

export function mapWizardDraftToSnapshot(draft: ProjectWizardDraft): ConstructionProjectSnapshot {
  const loc = parseLocationParts(draft.location);
  const builtUp = Number(draft.builtUpAreaSqft);
  const floors = Number(draft.floors);
  const area = Number.isFinite(builtUp) && builtUp > 0 ? builtUp : null;
  const floorCount = Number.isFinite(floors) && floors > 0 ? floors : null;
  const derived = estimateFromAssumptions({
    location: loc.location,
    propertyType: draft.buildMode === 'renovation' ? 'renovation' : draft.projectType,
    builtUpArea: area,
    floors: floorCount,
    quality: draft.quality,
  });
  const name = draft.name.trim() || 'My construction project';
  return {
    id: 'local:wizard',
    name,
    location: loc.location,
    city: loc.city,
    state: loc.state,
    builtUpArea: area,
    areaUnit: 'sqft',
    floors: floorCount,
    propertyType: draft.projectType || null,
    constructionQuality: draft.quality,
    estimatedCost: derived?.estimatedCost ?? (Number(draft.budgetInr) || null),
    materialCost: derived?.materialCost ?? null,
    labourCost: derived?.labourCost ?? null,
    contingency: derived?.contingency ?? null,
    createdAt: null,
    updatedAt: draft.savedAt ? new Date(draft.savedAt).toISOString() : null,
    persistence: 'local-wizard',
    editHref: '/construction/project/new',
  };
}

export type CostCalculatorStored = {
  savedAt?: number;
  lastTotal?: number;
  form?: {
    location?: string;
    propertyType?: string;
    builtUpArea?: string;
    areaUnit?: 'sqft' | 'sqm';
    floors?: string;
    quality?: string;
    contingencyPercent?: string;
  };
};

export function mapCostCalcStorageToSnapshot(
  stored: CostCalculatorStored | null,
): ConstructionProjectSnapshot | null {
  if (!stored?.savedAt || !stored.form) return null;
  const form = stored.form;
  const loc = parseLocationParts(form.location);
  const builtUp = Number(form.builtUpArea);
  const floors = Number(form.floors);
  const area = Number.isFinite(builtUp) && builtUp > 0 ? builtUp : null;
  const floorCount = Number.isFinite(floors) && floors > 0 ? floors : null;
  const areaUnit = form.areaUnit === 'sqm' ? 'sqm' : 'sqft';
  const derived = estimateFromAssumptions({
    location: loc.location,
    propertyType: form.propertyType,
    builtUpArea: area,
    floors: floorCount,
    quality: form.quality ?? null,
  });
  const contingencyPct = Number(form.contingencyPercent);
  return {
    id: 'local:cost-calculator',
    name: 'My construction project',
    location: loc.location,
    city: loc.city,
    state: loc.state,
    builtUpArea: area,
    areaUnit,
    floors: floorCount,
    propertyType: form.propertyType ?? null,
    constructionQuality: form.quality ?? null,
    estimatedCost:
      derived?.estimatedCost ?? (typeof stored.lastTotal === 'number' ? stored.lastTotal : null),
    materialCost: derived?.materialCost ?? null,
    labourCost: derived?.labourCost ?? null,
    contingency: derived?.contingency ?? (Number.isFinite(contingencyPct) ? contingencyPct : null),
    createdAt: null,
    updatedAt: new Date(stored.savedAt).toISOString(),
    persistence: 'local-cost',
    editHref: '/construction/cost-calculator',
  };
}

export function pickCurrentConstructionProject(input: {
  serverProjects: ConstructionProject[];
  lastSelectedId: string | null;
  wizard: ProjectWizardDraft | null;
  costCalc: CostCalculatorStored | null;
}): CurrentProjectResolution {
  const cloud = input.serverProjects.filter((p) => p.id);
  if (cloud.length) {
    const selected =
      (input.lastSelectedId ? cloud.find((p) => p.id === input.lastSelectedId) : null) ??
      [...cloud].sort((a, b) => {
        const ta = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const tb = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return tb - ta;
      })[0];
    if (selected) return { status: 'ready', project: mapApiProjectToSnapshot(selected) };
  }

  const wizardSnap = isMeaningfulWizardDraft(input.wizard)
    ? mapWizardDraftToSnapshot(input.wizard!)
    : null;
  const costSnap = mapCostCalcStorageToSnapshot(input.costCalc);
  if (wizardSnap && costSnap) {
    const w = wizardSnap.updatedAt ? new Date(wizardSnap.updatedAt).getTime() : 0;
    const c = costSnap.updatedAt ? new Date(costSnap.updatedAt).getTime() : 0;
    return { status: 'ready', project: w >= c ? wizardSnap : costSnap };
  }
  if (wizardSnap) return { status: 'ready', project: wizardSnap };
  if (costSnap) return { status: 'ready', project: costSnap };
  return { status: 'empty' };
}

export function loadLocalCurrentProjectSources(): {
  wizard: ProjectWizardDraft | null;
  costCalc: CostCalculatorStored | null;
} {
  if (typeof window === 'undefined') return { wizard: null, costCalc: null };
  let costCalc: CostCalculatorStored | null = null;
  try {
    const raw = localStorage.getItem(COST_CALCULATOR_STORAGE_KEY);
    if (raw) costCalc = JSON.parse(raw) as CostCalculatorStored;
  } catch {
    costCalc = null;
  }
  return { wizard: loadProjectWizardDraft(), costCalc };
}

export { PROJECT_WIZARD_STORAGE_KEY };
