import { apiPublicFetch, ApiError } from '@/services/api-client';

export type ConstructionCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

export type ConstructionDashboard = {
  categories: number;
  materialsPublished: number;
  brandsPublished: number;
  costTemplatesPublished: number;
  projectsCount?: number;
  relatedCalculators?: Array<{ slug: string; name: string }>;
};

export type ConstructionBrand = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  featured?: boolean;
  materials?: ConstructionMaterial[];
  _count?: { materials?: number };
};

export type ConstructionMaterial = {
  id: string;
  name: string;
  description?: string | null;
  specifications?: string | Record<string, unknown> | null;
  unit?: string | null;
  approximatePrice?: number | string | null;
  affiliateUrl?: string | null;
  featured?: boolean;
  sponsored?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  imageUrl?: string | null;
  rating?: number | string | null;
  pros?: string | null;
  cons?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  brand?: { id: string; name: string; slug: string } | null;
};

export type ConstructionCostTemplate = {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  formulaReference?: string | null;
};

export type ConstructionProjectItem = {
  id: string;
  name?: string | null;
  quantity?: number | string | null;
  unitCost?: number | string | null;
  estimatedCost?: number | string | null;
  material?: { id: string; name: string } | null;
};

export type ConstructionProject = {
  id: string;
  name: string;
  projectType?: string | null;
  areaSqft?: number | string | null;
  region?: string | null;
  estimatedCost?: number | string | null;
  notes?: string | null;
  breakdown?: Array<{ label: string; amount: number | string }> | null;
  items?: ConstructionProjectItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type ConstructionGuide = {
  slug: string;
  title: string;
  summary?: string | null;
  category?: string | null;
  content?: string | null;
};

export type ConstructionFaq = {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  sortOrder?: number | null;
};

export type ConstructionSupplier = {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  phone?: string | null;
  description?: string | null;
  sponsored?: boolean;
  category?: string | null;
};

export type ConstructionChecklistSummary = {
  slug: string;
  title: string;
  description?: string | null;
  itemCount?: number;
  phase?: string | null;
};

export type ConstructionChecklistItem = {
  id?: string;
  label: string;
  description?: string | null;
  phase?: string | null;
  sortOrder?: number | null;
};

export type ConstructionChecklist = {
  slug: string;
  title: string;
  description?: string | null;
  items: ConstructionChecklistItem[];
};

export type ConstructionEstimateResult = {
  templateSlug?: string | null;
  areaSqft: number;
  region?: string | null;
  quality?: string | null;
  rooms?: Array<{ name: string; areaSqft: number; materialCost: number }>;
  lineItems?: Array<{ label: string; amount: number }>;
  materialCost?: number | string | null;
  laborCost?: number | string | null;
  equipmentCost?: number | string | null;
  contingency?: number | string | null;
  totalCost?: number | string | null;
  breakdown?: Array<{ label: string; amount: number | string }>;
};

export type ConstructionTimelinePhase = {
  label: string;
  durationWeeks?: number | null;
  description?: string | null;
};

type ListOptions = {
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  featured?: boolean;
};

function buildQs(options?: ListOptions) {
  const qs = new URLSearchParams({ limit: String(options?.limit ?? 24) });
  if (options?.search) qs.set('search', options.search);
  if (options?.featured) qs.set('featured', 'true');
  if (options?.categoryId) qs.set('categoryId', options.categoryId);
  if (options?.brandId) qs.set('brandId', options.brandId);
  return qs.toString();
}

export async function fetchConstructionDashboard() {
  try {
    return await apiPublicFetch<ConstructionDashboard>('/construction/dashboard', { cache: 'no-store' });
  } catch {
    return { data: null };
  }
}

export async function fetchConstructionCategories() {
  try {
    return await apiPublicFetch<ConstructionCategory[]>('/construction/categories', { cache: 'no-store' });
  } catch {
    return { data: [] as ConstructionCategory[] };
  }
}

export async function fetchConstructionMaterials(options?: ListOptions) {
  try {
    return await apiPublicFetch<ConstructionMaterial[]>(`/construction/materials?${buildQs(options)}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as ConstructionMaterial[], meta: undefined };
  }
}

export async function fetchConstructionMaterial(id: string) {
  return apiPublicFetch<ConstructionMaterial>(`/construction/materials/${id}`, { cache: 'no-store' });
}

export async function fetchConstructionBrands(options?: ListOptions) {
  try {
    return await apiPublicFetch<ConstructionBrand[]>(`/construction/brands?${buildQs(options)}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as ConstructionBrand[], meta: undefined };
  }
}

export async function fetchConstructionBrandBySlug(slug: string) {
  try {
    return await apiPublicFetch<ConstructionBrand>(`/construction/brands/slug/${slug}`, { cache: 'no-store' });
  } catch {
    throw new Error('Brand not found');
  }
}

export async function fetchConstructionCompare(ids: string[]) {
  const qs = new URLSearchParams({ ids: ids.join(',') });
  return apiPublicFetch<ConstructionMaterial[]>(`/construction/compare?${qs.toString()}`, { cache: 'no-store' });
}

export async function fetchConstructionCostTemplates() {
  try {
    return await apiPublicFetch<ConstructionCostTemplate[]>('/construction/cost-templates', { cache: 'no-store' });
  } catch {
    return { data: [] as ConstructionCostTemplate[] };
  }
}

export async function submitConstructionEstimate(body: {
  templateSlug?: string;
  areaSqft: number;
  region?: string;
  quality?: 'basic' | 'standard' | 'premium';
}) {
  return apiPublicFetch<ConstructionEstimateResult>('/construction/estimate', {
    method: 'POST',
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

export async function fetchConstructionProjects(): Promise<{
  data: ConstructionProject[] | null;
  unauthorized?: boolean;
}> {
  try {
    const { apiServerFetch } = await import('@/lib/api');
    const result = await apiServerFetch<ConstructionProject[]>('/construction/projects');
    if (result.status === 401) {
      return { data: null, unauthorized: true };
    }
    if (result.error) {
      return { data: [] };
    }
    return { data: result.data ?? [] };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return { data: null, unauthorized: true };
    }
    return { data: [] };
  }
}

export async function fetchConstructionChecklists() {
  try {
    return await apiPublicFetch<ConstructionChecklistSummary[]>('/construction/checklists', { cache: 'no-store' });
  } catch {
    return { data: [] as ConstructionChecklistSummary[] };
  }
}

export async function fetchConstructionChecklist(slug: string) {
  return apiPublicFetch<ConstructionChecklist>(`/construction/checklists/${slug}`, { cache: 'no-store' });
}

export async function fetchConstructionSuppliers() {
  try {
    const result = await apiPublicFetch<ConstructionSupplier[] | { businesses?: ConstructionSupplier[] }>(
      '/construction/suppliers',
      { cache: 'no-store' },
    );
    const data = result.data;
    if (Array.isArray(data)) {
      return { data };
    }
    if (data && typeof data === 'object' && Array.isArray(data.businesses)) {
      return { data: data.businesses };
    }
    return { data: [] as ConstructionSupplier[] };
  } catch {
    return { data: [] as ConstructionSupplier[] };
  }
}

export async function createConstructionProject(body: {
  name: string;
  projectType?: string;
  estimatedCost?: number;
}) {
  const { apiServerFetch } = await import('@/lib/api');
  const result = await apiServerFetch<ConstructionProject>('/construction/projects', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (result.error || !result.data) {
    throw new ApiError(result.error || 'Create project failed', result.status);
  }
  return { data: result.data };
}

export async function fetchConstructionGuides() {
  try {
    return await apiPublicFetch<ConstructionGuide[]>('/construction/guides', { cache: 'no-store' });
  } catch {
    return { data: [] as ConstructionGuide[] };
  }
}

export async function fetchConstructionGuide(slug: string) {
  return apiPublicFetch<ConstructionGuide>(`/construction/guides/${slug}`, { cache: 'no-store' });
}

export async function fetchConstructionFaqs() {
  try {
    return await apiPublicFetch<ConstructionFaq[]>('/construction/faqs', { cache: 'no-store' });
  } catch {
    return { data: [] as ConstructionFaq[] };
  }
}

export function getEstimateReportUrl(params: {
  areaSqft: number | string;
  quality?: string;
  templateSlug?: string;
  format?: 'pdf' | 'json';
}) {
  const qs = new URLSearchParams({
    areaSqft: String(params.areaSqft),
  });
  if (params.quality) qs.set('quality', params.quality);
  if (params.templateSlug) qs.set('templateSlug', params.templateSlug);
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
  const path =
    params.format === 'json'
      ? `/construction/reports/estimate?${qs.toString()}`
      : `/construction/reports/estimate.pdf?${qs.toString()}`;
  return `${base}${path}`;
}

export function parseMaterialGuideSteps(
  specifications: ConstructionMaterial['specifications'],
): Array<{ name: string; text: string }> | null {
  if (!specifications) return null;
  let parsed: Record<string, unknown> | null = null;
  if (typeof specifications === 'string') {
    try {
      parsed = JSON.parse(specifications) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (typeof specifications === 'object') {
    parsed = specifications as Record<string, unknown>;
  }
  const steps = parsed?.guideSteps;
  if (!Array.isArray(steps) || !steps.length) return null;
  const normalized = steps
    .map((step) => {
      if (!step || typeof step !== 'object') return null;
      const row = step as Record<string, unknown>;
      const name = String(row.name ?? row.title ?? '').trim();
      const text = String(row.text ?? row.description ?? '').trim();
      if (!name && !text) return null;
      return { name: name || 'Step', text };
    })
    .filter(Boolean) as Array<{ name: string; text: string }>;
  return normalized.length ? normalized : null;
}

export function defaultConstructionTimeline(): ConstructionTimelinePhase[] {
  return [
    { label: 'Planning & permits', durationWeeks: 2, description: 'Finalize plans, budgets, and approvals.' },
    { label: 'Foundation', durationWeeks: 3, description: 'Excavation, footing, and plinth work.' },
    { label: 'Structure', durationWeeks: 8, description: 'Columns, beams, slabs, and masonry.' },
    { label: 'MEP rough-in', durationWeeks: 4, description: 'Electrical, plumbing, and HVAC conduits.' },
    { label: 'Finishes', durationWeeks: 6, description: 'Flooring, paint, fixtures, and interiors.' },
    { label: 'Handover', durationWeeks: 1, description: 'Snagging, cleaning, and final inspection.' },
  ];
}
