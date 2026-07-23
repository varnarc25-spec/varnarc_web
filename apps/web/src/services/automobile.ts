import { apiPublicFetch } from '@/services/api-client';

export type AutomobileDashboard = {
  manufacturersPublished: number;
  vehiclesPublished: number;
  maintenanceSchedules: number;
  faqs: number;
  guides: number;
  comparisons: number;
  relatedCalculators?: Array<{ slug: string; name: string }>;
  dealerDirectory?: { href: string; label: string };
};

export type AutomobileManufacturer = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  country?: string | null;
  featured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  vehicles?: AutomobileVehicle[];
  _count?: { vehicles?: number };
};

export type AutomobileVehicle = {
  id: string;
  name: string;
  slug: string;
  model?: string | null;
  variant?: string | null;
  modelYear?: number | null;
  category?: string | null;
  bodyType?: string | null;
  fuelType?: string | null;
  transmission?: string | null;
  mileage?: number | string | null;
  seatingCapacity?: number | null;
  safetyRating?: number | string | null;
  exShowroomPrice?: number | string | null;
  estimatedOnRoadPrice?: number | string | null;
  warranty?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  affiliateUrl?: string | null;
  expertRating?: number | string | null;
  featured?: boolean;
  sponsored?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  manufacturer?: { id: string; name: string; slug: string } | null;
  manufacturerId?: string | null;
  images?: Array<{
    id: string;
    imageUrl?: string | null;
    mediaId?: string | null;
    altText?: string | null;
    displayOrder?: number;
  }>;
  reviewLinks?: Array<{
    reviewId: string;
    review: AutomobileReview;
  }>;
};

export type AutomobileOffers = {
  loans: Array<{
    id: string;
    name: string;
    slug: string;
    href: string;
    interestRate?: number | string | null;
    affiliateUrl?: string | null;
    bank?: { name?: string | null; slug?: string | null } | null;
  }>;
  insurance: Array<{
    id: string;
    name: string;
    slug: string;
    href: string;
    providerName?: string | null;
    premium?: number | string | null;
    coverage?: string | null;
    affiliateUrl?: string | null;
  }>;
};

export type AutomobileMaintenance = {
  id: string;
  title: string;
  serviceInterval: string;
  estimatedCost?: number | string | null;
  notes?: string | null;
  vehicle?: { id: string; name: string; slug?: string } | null;
  vehicleId?: string;
};

export type AutomobileGuide = {
  slug: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  content?: string | null;
};

export type AutomobileFaq = {
  id: string;
  question: string;
  answer: string;
  sortOrder?: number | null;
};

export type AutomobileDealer = {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  phone?: string | null;
  description?: string | null;
  sponsored?: boolean;
  category?: string | null;
};

export type AutomobileReview = {
  id: string;
  title?: string | null;
  slug?: string | null;
  rating?: number | string | null;
  overallScore?: number | string | null;
  body?: string | null;
  summary?: string | null;
  excerpt?: string | null;
  product?: { name?: string | null; slug?: string | null } | null;
  vehicle?: { id: string; name: string; slug: string } | null;
};

type ListOptions = {
  limit?: number;
  search?: string;
  manufacturerId?: string;
  category?: string;
  fuelType?: string;
  featured?: boolean;
  bodyType?: string;
};

function buildQs(options?: ListOptions) {
  const qs = new URLSearchParams({ limit: String(options?.limit ?? 24) });
  if (options?.search) qs.set('search', options.search);
  if (options?.featured) qs.set('featured', 'true');
  if (options?.manufacturerId) qs.set('manufacturerId', options.manufacturerId);
  if (options?.category) qs.set('category', options.category);
  if (options?.fuelType) qs.set('fuelType', options.fuelType);
  if (options?.bodyType) qs.set('bodyType', options.bodyType);
  return qs.toString();
}

export async function fetchAutomobileDashboard() {
  try {
    return await apiPublicFetch<AutomobileDashboard>('/automobile/dashboard', { cache: 'no-store' });
  } catch {
    return { data: null };
  }
}

export async function fetchAutomobileManufacturers(options?: ListOptions) {
  try {
    return await apiPublicFetch<AutomobileManufacturer[]>(`/automobile/manufacturers?${buildQs(options)}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as AutomobileManufacturer[], meta: undefined };
  }
}

export async function fetchAutomobileManufacturerBySlug(slug: string) {
  return apiPublicFetch<AutomobileManufacturer>(`/automobile/manufacturers/slug/${slug}`, { cache: 'no-store' });
}

export async function fetchAutomobileVehicles(options?: ListOptions) {
  try {
    return await apiPublicFetch<AutomobileVehicle[]>(`/automobile/vehicles?${buildQs(options)}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as AutomobileVehicle[], meta: undefined };
  }
}

export async function fetchAutomobileVehicleBySlug(slug: string) {
  return apiPublicFetch<AutomobileVehicle>(`/automobile/vehicles/slug/${slug}`, { cache: 'no-store' });
}

export async function fetchAutomobileVehicle(id: string) {
  return apiPublicFetch<AutomobileVehicle>(`/automobile/vehicles/${id}`, { cache: 'no-store' });
}

export async function fetchAutomobileCompare(ids: string[]) {
  const qs = new URLSearchParams({ ids: ids.join(',') });
  return apiPublicFetch<AutomobileVehicle[]>(`/automobile/compare?${qs.toString()}`, { cache: 'no-store' });
}

export async function fetchAutomobileMaintenance(vehicleId?: string) {
  try {
    const qs = vehicleId ? `?vehicleId=${encodeURIComponent(vehicleId)}` : '';
    return await apiPublicFetch<AutomobileMaintenance[]>(`/automobile/maintenance${qs}`, { cache: 'no-store' });
  } catch {
    return { data: [] as AutomobileMaintenance[] };
  }
}

export async function fetchAutomobileDealers() {
  try {
    const result = await apiPublicFetch<{ businesses?: AutomobileDealer[] } | AutomobileDealer[]>(
      '/automobile/dealers',
      { cache: 'no-store' },
    );
    const data = result.data;
    if (Array.isArray(data)) return { data };
    if (data && typeof data === 'object' && Array.isArray(data.businesses)) {
      return { data: data.businesses };
    }
    return { data: [] as AutomobileDealer[] };
  } catch {
    return { data: [] as AutomobileDealer[] };
  }
}

export async function fetchAutomobileReviews(vehicleId?: string) {
  try {
    const qs = vehicleId ? `?vehicleId=${encodeURIComponent(vehicleId)}` : '';
    return await apiPublicFetch<AutomobileReview[]>(`/automobile/reviews${qs}`, { cache: 'no-store' });
  } catch {
    return { data: [] as AutomobileReview[] };
  }
}

export async function fetchAutomobileVehicleOffers(vehicleId: string) {
  try {
    return await apiPublicFetch<AutomobileOffers>(`/automobile/vehicles/${vehicleId}/offers`, {
      cache: 'no-store',
    });
  } catch {
    return { data: { loans: [], insurance: [] } as AutomobileOffers };
  }
}

export async function fetchAutomobileFaqs() {
  try {
    return await apiPublicFetch<AutomobileFaq[]>('/automobile/faqs', { cache: 'no-store' });
  } catch {
    return { data: [] as AutomobileFaq[] };
  }
}

export async function fetchAutomobileGuides() {
  try {
    return await apiPublicFetch<AutomobileGuide[]>('/automobile/guides', { cache: 'no-store' });
  } catch {
    return { data: [] as AutomobileGuide[] };
  }
}

export async function fetchAutomobileGuide(slug: string) {
  return apiPublicFetch<AutomobileGuide>(`/automobile/guides/${slug}`, { cache: 'no-store' });
}

export type AutomobileSavedComparison = {
  id: string;
  title: string;
  slug: string;
  entityType?: string;
  vehicleCount?: number;
  vehicleIds?: string[];
  vehicles?: AutomobileVehicle[];
};

export async function fetchAutomobileComparisons() {
  try {
    return await apiPublicFetch<AutomobileSavedComparison[]>('/automobile/comparisons', { cache: 'no-store' });
  } catch {
    return { data: [] as AutomobileSavedComparison[] };
  }
}

export async function fetchAutomobileComparisonBySlug(slug: string) {
  return apiPublicFetch<AutomobileSavedComparison>(`/automobile/comparisons/slug/${slug}`, { cache: 'no-store' });
}

export async function trackAutomobileAffiliateLead(input: {
  entityId: string;
  entityType?: string;
  affiliateUrl?: string | null;
  name?: string;
  email?: string;
  phone?: string;
}) {
  return apiPublicFetch<{ id: string }>('/automobile/affiliate/lead', {
    method: 'POST',
    body: JSON.stringify({
      entityType: input.entityType ?? 'automobile_vehicle',
      entityId: input.entityId,
      affiliateUrl: input.affiliateUrl,
      name: input.name,
      email: input.email,
      phone: input.phone,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      sessionId: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : null,
    }),
  });
}

export const AUTOMOBILE_CALCULATOR_LINKS = [
  { href: '/calculators/car-loan', label: 'Car Loan Calculator' },
  { href: '/calculators/fuel', label: 'Fuel Cost Calculator' },
  { href: '/calculators/mileage', label: 'Mileage Calculator' },
  { href: '/calculators/car-insurance', label: 'Car Insurance Estimator' },
  { href: '/calculators/depreciation', label: 'Depreciation Calculator' },
  { href: '/calculators/maintenance-cost', label: 'Maintenance Cost Estimator' },
];
