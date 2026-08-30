/** Draft persistence for Create Construction Project wizard. */

export const PROJECT_WIZARD_STORAGE_KEY = 'varnarc.construction.project-wizard.v1';

export type ProjectBuildMode = 'new' | 'renovation';
export type ProjectQuality = 'basic' | 'standard' | 'premium';

export type ProjectWizardDraft = {
  step: number;
  name: string;
  location: string;
  projectType: string;
  buildMode: ProjectBuildMode;
  plotAreaSqft: string;
  builtUpAreaSqft: string;
  floors: string;
  bedrooms: string;
  quality: ProjectQuality;
  expectedStartDate: string;
  budgetInr: string;
  savedAt?: number;
};

export const PROJECT_WIZARD_STEPS = [
  { id: 'basics', title: 'Basics', description: 'Name and location' },
  { id: 'type', title: 'Type', description: 'What you are building' },
  { id: 'size', title: 'Size', description: 'Areas and floors' },
  { id: 'quality', title: 'Quality', description: 'Construction finish' },
  { id: 'optional', title: 'Optional', description: 'Timing and budget' },
] as const;

export const PROJECT_TYPE_OPTIONS = [
  { value: 'house-construction', label: 'House / villa' },
  { value: 'apartment', label: 'Apartment / flat' },
  { value: 'commercial', label: 'Commercial / office' },
  { value: 'interior-fitout', label: 'Interior fit-out' },
  { value: 'other', label: 'Other' },
] as const;

export function defaultProjectWizardDraft(): ProjectWizardDraft {
  return {
    step: 0,
    name: '',
    location: '',
    projectType: 'house-construction',
    buildMode: 'new',
    plotAreaSqft: '',
    builtUpAreaSqft: '',
    floors: '1',
    bedrooms: '',
    quality: 'standard',
    expectedStartDate: '',
    budgetInr: '',
  };
}

export function loadProjectWizardDraft(): ProjectWizardDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROJECT_WIZARD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProjectWizardDraft>;
    return { ...defaultProjectWizardDraft(), ...parsed };
  } catch {
    return null;
  }
}

export function saveProjectWizardDraft(draft: ProjectWizardDraft): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      PROJECT_WIZARD_STORAGE_KEY,
      JSON.stringify({ ...draft, savedAt: Date.now() }),
    );
  } catch {
    /* ignore quota */
  }
}

export function clearProjectWizardDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PROJECT_WIZARD_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Rough indicative cost aligned with API materialCostForArea defaults. */
export function preliminaryCostInr(builtUpAreaSqft: number, quality: ProjectQuality): number {
  const base = quality === 'premium' ? 2200 : quality === 'basic' ? 1400 : 1800;
  const multiplier = quality === 'premium' ? 1.25 : quality === 'basic' ? 0.85 : 1;
  return Math.round(builtUpAreaSqft * base * multiplier);
}
