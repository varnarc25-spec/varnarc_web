/** Local SVG/PNG assets under /public/hub */
export const HUB_MODULE_ASSETS = {
  finance: {
    heroIllustration: '/hub/finance/finance-hero.png',
    overviewVisual: '/hub/finance/overview-visual.svg',
  },
} as const;

const unsplash = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const GUIDE_IMAGE_DEFAULT = '/hub/finance/guide-personal-loan.png';
const FEATURED_IMAGE_DEFAULT = unsplash('photo-1554224155-6726b3ff858f', 400);

/** Default guide card images keyed by slug or topic keyword */
export const FINANCE_GUIDE_IMAGES: Record<string, string> = {
  default: GUIDE_IMAGE_DEFAULT,
  'sip-basics-for-beginners': '/hub/finance/guide-sip-investment.png',
  'how-to-choose-a-personal-loan': '/hub/finance/guide-personal-loan.png',
  loans: '/hub/finance/guide-personal-loan.png',
  'personal-loan': '/hub/finance/categories/personal-loan.svg',
  'home-loan': '/hub/finance/categories/home-loan.svg',
  'car-loan': '/hub/finance/categories/car-loan.svg',
  'education-loan': '/hub/finance/categories/education-loan.svg',
  'business-loan': '/hub/finance/categories/business-loan.svg',
  'gold-loan': '/hub/finance/categories/gold-loan.svg',
  'credit-cards': '/hub/finance/overview-visual.svg',
  insurance: '/hub/finance/overview-visual.svg',
  investments: '/hub/finance/guide-sip-investment.png',
  tax: '/hub/finance/overview-visual.svg',
  emi: '/hub/finance/guide-personal-loan.png',
  'credit-score': '/hub/finance/guide-personal-loan.png',
};

export const FINANCE_FEATURED_IMAGES: Record<string, string> = {
  loan: unsplash('photo-1560518883-ce09059eeffa', 400),
  'credit-card': unsplash('photo-1556742049-0cfed4f6a45d', 400),
  insurance: unsplash('photo-1450101499163-c8848c66ca85', 400),
  investment: unsplash('photo-1611970816684-1f9d2d7b1c4a', 400),
  default: FEATURED_IMAGE_DEFAULT,
};

function resolveGuideImage(key: string): string {
  return FINANCE_GUIDE_IMAGES[key] ?? GUIDE_IMAGE_DEFAULT;
}

function resolveFeaturedImage(key: string): string {
  return FINANCE_FEATURED_IMAGES[key] ?? FEATURED_IMAGE_DEFAULT;
}

export function getFinanceGuideImage(slug: string, category?: string | null): string {
  if (FINANCE_GUIDE_IMAGES[slug]) return resolveGuideImage(slug);
  const key = `${slug} ${category ?? ''}`.toLowerCase();
  if (/\bhome\b|\bhousing\b|\bmortgage\b/.test(key)) return resolveGuideImage('home-loan');
  if (/\bcar\b|\bauto\b|\bvehicle\b/.test(key)) return resolveGuideImage('car-loan');
  if (/\beducation\b|\bstudent\b/.test(key)) return resolveGuideImage('education-loan');
  if (/\bbusiness\b|\bsme\b/.test(key)) return resolveGuideImage('business-loan');
  if (/\bgold\b/.test(key)) return resolveGuideImage('gold-loan');
  if (/\bemi\b|\bpersonal\b|\bloan\b|\bcredit\s+score\b/.test(key)) {
    return resolveGuideImage('loans');
  }
  const cat = category?.toLowerCase() ?? '';
  if (cat.includes('loan')) return resolveGuideImage('loans');
  if (cat.includes('credit')) return resolveGuideImage('credit-cards');
  if (cat.includes('insur')) return resolveGuideImage('insurance');
  if (cat.includes('invest')) return resolveGuideImage('investments');
  if (cat.includes('tax')) return resolveGuideImage('tax');
  return GUIDE_IMAGE_DEFAULT;
}

export function getFinanceFeaturedImage(href: string): string {
  if (href.includes('/loans/')) return resolveFeaturedImage('loan');
  if (href.includes('/credit-cards/')) return resolveFeaturedImage('credit-card');
  if (href.includes('/insurance/')) return resolveFeaturedImage('insurance');
  if (href.includes('/investments/')) return resolveFeaturedImage('investment');
  return FEATURED_IMAGE_DEFAULT;
}

export function getHubModuleAssets(moduleKey: string) {
  return (
    HUB_MODULE_ASSETS[moduleKey as keyof typeof HUB_MODULE_ASSETS] ?? HUB_MODULE_ASSETS.finance
  );
}
