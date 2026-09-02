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
  safetyAgency?: string | null;
  safetySourceUrl?: string | null;
  engineCapacity?: string | null;
  horsepower?: number | string | null;
  torque?: number | string | null;
  groundClearance?: number | string | null;
  bootSpace?: number | string | null;
  specifications?: Record<string, unknown> | null;
  exShowroomPrice?: number | string | null;
  estimatedOnRoadPrice?: number | string | null;
  warranty?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  imageAttribution?: string | null;
  launchStatus?: string | null;
  lastVerifiedAt?: string | null;
  affiliateUrl?: string | null;
  expertRating?: number | string | null;
  featured?: boolean;
  sponsored?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  manufacturer?: { id: string; name: string; slug: string; logoUrl?: string | null } | null;
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
  manufacturerSlug?: string;
  category?: string;
  fuelType?: string;
  featured?: boolean;
  bodyType?: string;
  transmission?: string;
  minSeats?: number;
  maxPrice?: number;
  minMileage?: number;
  minSafety?: number;
  sort?: 'featured' | 'price_asc' | 'price_desc' | 'mileage' | 'newest';
  page?: number;
  launchMode?: 'current' | 'upcoming' | 'launches';
};

export type AutomobileModelSummary = {
  manufacturerId: string;
  manufacturer: { id: string; name: string; slug: string; logoUrl?: string | null };
  model: string;
  name: string;
  slug: string;
  representativeId: string;
  variantCount: number;
  imageUrl?: string | null;
  imageAttribution?: string | null;
  minPrice?: number | string | null;
  maxPrice?: number | string | null;
  minMileage?: number | string | null;
  maxMileage?: number | string | null;
  minSeats?: number | null;
  maxSeats?: number | null;
  minYear?: number | null;
  maxYear?: number | null;
  safetyRating?: number | string | null;
  safetyAgency?: string | null;
  groundClearance?: number | string | null;
  fuels: string[];
  transmissions: string[];
  bodyTypes: string[];
  featured?: boolean;
};

function buildQs(options?: ListOptions) {
  const qs = new URLSearchParams({ limit: String(options?.limit ?? 24) });
  if (options?.search) qs.set('search', options.search);
  if (options?.featured) qs.set('featured', 'true');
  if (options?.manufacturerId) qs.set('manufacturerId', options.manufacturerId);
  if (options?.manufacturerSlug) qs.set('manufacturerSlug', options.manufacturerSlug);
  if (options?.category) qs.set('category', options.category);
  if (options?.fuelType) qs.set('fuelType', options.fuelType);
  if (options?.bodyType) qs.set('bodyType', options.bodyType);
  if (options?.transmission) qs.set('transmission', options.transmission);
  if (options?.minSeats != null) qs.set('minSeats', String(options.minSeats));
  if (options?.maxPrice != null) qs.set('maxPrice', String(options.maxPrice));
  if (options?.minMileage != null) qs.set('minMileage', String(options.minMileage));
  if (options?.minSafety != null) qs.set('minSafety', String(options.minSafety));
  if (options?.sort) qs.set('sort', options.sort);
  if (options?.page) qs.set('page', String(options.page));
  if (options?.launchMode) qs.set('launchMode', options.launchMode);
  return qs.toString();
}

export async function fetchAutomobileDashboard() {
  try {
    return await apiPublicFetch<AutomobileDashboard>('/automobile/dashboard', {
      cache: 'no-store',
    });
  } catch {
    return { data: null };
  }
}

export async function fetchAutomobileManufacturers(options?: ListOptions) {
  try {
    return await apiPublicFetch<AutomobileManufacturer[]>(
      `/automobile/manufacturers?${buildQs(options)}`,
      {
        cache: 'no-store',
      },
    );
  } catch {
    return { data: [] as AutomobileManufacturer[], meta: undefined };
  }
}

export async function fetchAutomobileManufacturerBySlug(slug: string) {
  return apiPublicFetch<AutomobileManufacturer>(`/automobile/manufacturers/slug/${slug}`, {
    cache: 'no-store',
  });
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

export async function fetchAutomobileModels(options?: ListOptions) {
  try {
    return await apiPublicFetch<{
      items: AutomobileModelSummary[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/automobile/vehicles/models?${buildQs({ ...options, limit: options?.limit ?? 12 })}`, {
      cache: 'no-store',
    });
  } catch {
    return {
      data: { items: [] as AutomobileModelSummary[], total: 0, page: 1, pageSize: 12 },
    };
  }
}

export async function fetchAutomobileVehicleBySlug(slug: string) {
  return apiPublicFetch<AutomobileVehicle>(`/automobile/vehicles/slug/${slug}`, {
    cache: 'no-store',
  });
}

export async function fetchAutomobileVehicle(id: string) {
  return apiPublicFetch<AutomobileVehicle>(`/automobile/vehicles/${id}`, { cache: 'no-store' });
}

export async function fetchAutomobileCompare(ids: string[]) {
  const qs = new URLSearchParams({ ids: ids.join(',') });
  return apiPublicFetch<AutomobileVehicle[]>(`/automobile/compare?${qs.toString()}`, {
    cache: 'no-store',
  });
}

export async function fetchAutomobileMaintenance(vehicleId?: string) {
  try {
    const qs = vehicleId ? `?vehicleId=${encodeURIComponent(vehicleId)}` : '';
    return await apiPublicFetch<AutomobileMaintenance[]>(`/automobile/maintenance${qs}`, {
      cache: 'no-store',
    });
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
    return await apiPublicFetch<AutomobileReview[]>(`/automobile/reviews${qs}`, {
      cache: 'no-store',
    });
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
    return await apiPublicFetch<AutomobileSavedComparison[]>('/automobile/comparisons', {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as AutomobileSavedComparison[] };
  }
}

export async function fetchAutomobileComparisonBySlug(slug: string) {
  return apiPublicFetch<AutomobileSavedComparison>(`/automobile/comparisons/slug/${slug}`, {
    cache: 'no-store',
  });
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
      sessionId:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : null,
    }),
  });
}

export const AUTOMOBILE_CALCULATOR_LINKS = [
  { href: '/automobile/calculators/car-loan', label: 'Car Loan Calculator' },
  { href: '/automobile/calculators/fuel', label: 'Fuel Cost Calculator' },
  { href: '/automobile/calculators/mileage', label: 'Mileage Calculator' },
  { href: '/automobile/calculators/car-insurance', label: 'Car Insurance Estimator' },
  { href: '/automobile/calculators/depreciation', label: 'Depreciation Calculator' },
  { href: '/automobile/calculators/resale-value', label: 'Resale Value Planner' },
  { href: '/automobile/calculators/maintenance-cost', label: 'Maintenance Cost Estimator' },
  { href: '/automobile/calculators/tco', label: 'Total Cost of Ownership' },
  { href: '/automobile/calculators/road-tax', label: 'Road Tax Estimator' },
  { href: '/automobile/calculators/on-road-price', label: 'On-road Price' },
  { href: '/automobile/calculators/charging-cost', label: 'EV Charging Cost' },
  { href: '/automobile/calculators/range', label: 'EV Range Calculator' },
  { href: '/automobile/calculators/ev-vs-petrol', label: 'EV vs Petrol' },
];
