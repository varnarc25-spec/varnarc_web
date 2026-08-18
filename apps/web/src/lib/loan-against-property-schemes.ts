/**
 * LAP regulatory / educational scheme records.
 * Reuses freshness helpers from education schemes. No invented numerical LTV caps.
 */

import {
  formatSchemeVerifiedDate,
  governmentSchemeFreshness,
  isPublishedGovernmentScheme as isPublishedBase,
  schemeAllowsPublicNumericRules,
  schemeEligibilityStatusLabel,
  type EducationGovernmentScheme,
  type GovernmentSchemeFreshness,
  type GovernmentSchemeStatus,
  type GovernmentSchemeType,
  type SchemeEligibilityStatus,
} from '@/lib/education-loan-schemes';

export {
  formatSchemeVerifiedDate,
  governmentSchemeFreshness,
  schemeAllowsPublicNumericRules,
  schemeEligibilityStatusLabel,
  type GovernmentSchemeFreshness,
  type GovernmentSchemeStatus,
  type GovernmentSchemeType,
  type SchemeEligibilityStatus,
};

export type LapGovernmentScheme = EducationGovernmentScheme & {
  topicTags?: string[];
};

export type LapSchemeEligibilityInput = {
  locationIndia?: boolean | null;
  hasOwnedProperty?: boolean | null;
  propertyValueKnown?: boolean | null;
  requiredLoanInr?: number | null;
};

export type LapSchemeEligibilityResult = {
  scheme: LapGovernmentScheme;
  status: SchemeEligibilityStatus;
  matchedConditions: string[];
  unmetConditions: string[];
  unknownConditions: string[];
  explanation: string;
  freshness: GovernmentSchemeFreshness;
  showNumericRules: boolean;
};

export function isPublishedLapScheme(scheme: LapGovernmentScheme): boolean {
  return isPublishedBase(scheme);
}

export function lapSchemeEffectiveWindow(
  scheme: LapGovernmentScheme,
  now = new Date(),
): 'active' | 'future' | 'ended' | 'unknown' {
  const from = scheme.effectiveFrom ? new Date(scheme.effectiveFrom) : null;
  const to = scheme.effectiveTo ? new Date(scheme.effectiveTo) : null;
  const hasFrom = from != null && Number.isFinite(from.getTime());
  const hasTo = to != null && Number.isFinite(to.getTime());
  if (!hasFrom && !hasTo) return 'unknown';
  if (hasFrom && now.getTime() < from!.getTime()) return 'future';
  if (hasTo && now.getTime() > to!.getTime()) return 'ended';
  return 'active';
}

export function evaluateLapSchemeRelevance(
  scheme: LapGovernmentScheme,
  input: LapSchemeEligibilityInput,
  now = new Date(),
): LapSchemeEligibilityResult {
  const freshness = governmentSchemeFreshness(scheme.lastVerifiedAt, now, scheme.status);
  const showNumericRules = schemeAllowsPublicNumericRules(freshness);
  const matchedConditions: string[] = [];
  const unmetConditions: string[] = [];
  const unknownConditions: string[] = [];

  const build = (
    status: SchemeEligibilityStatus,
    explanation: string,
  ): LapSchemeEligibilityResult => ({
    scheme,
    status,
    matchedConditions: [...matchedConditions],
    unmetConditions: [...unmetConditions],
    unknownConditions: [...unknownConditions],
    explanation,
    freshness,
    showNumericRules,
  });

  if (scheme.status === 'archived' || freshness === 'archived') {
    return build(
      'insufficient_information',
      'This record is archived or stale. Verify current requirements on the official source.',
    );
  }

  if (input.locationIndia === false) {
    unmetConditions.push('Planning outside India');
    return build(
      'not_matched',
      'Seeded regulatory overviews focus on Indian regulated-lending context.',
    );
  }
  if (input.locationIndia == null) unknownConditions.push('Location');
  else matchedConditions.push('Planning in India');

  if (input.hasOwnedProperty === false) {
    unmetConditions.push('Owned property');
    return build(
      'may_be_relevant',
      'LAP planning typically assumes owned property available as security — confirm with the lender.',
    );
  }
  if (input.hasOwnedProperty == null) unknownConditions.push('Owned property');
  else matchedConditions.push('Owned property indicated');

  if (input.propertyValueKnown) matchedConditions.push('Property value entered');
  else unknownConditions.push('Property value');

  if (input.requiredLoanInr != null && input.requiredLoanInr > 0) {
    matchedConditions.push('Loan requirement entered');
  } else {
    unknownConditions.push('Loan requirement');
  }

  if (unknownConditions.length >= 2) {
    return build(
      'insufficient_information',
      'More planning inputs would help assess relevance. Confirm applicability with official sources and the lender.',
    );
  }

  return build(
    'may_be_relevant',
    'May be relevant for understanding secured lending / property-backed credit frameworks. Confirm current text on the official source.',
  );
}

function parseLapGovernmentSchemesFromCms(cmsRaw: unknown): LapGovernmentScheme[] {
  if (!Array.isArray(cmsRaw)) return [];
  const out: LapGovernmentScheme[] = [];
  for (const item of cmsRaw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === 'string' ? row.id : null;
    const name = typeof row.name === 'string' ? row.name : null;
    const slug = typeof row.slug === 'string' ? row.slug : null;
    const officialSourceUrl =
      typeof row.officialSourceUrl === 'string' ? row.officialSourceUrl : null;
    const lastVerifiedAt = typeof row.lastVerifiedAt === 'string' ? row.lastVerifiedAt : null;
    if (!id || !name || !slug || !officialSourceUrl || !lastVerifiedAt) continue;
    out.push({
      id,
      name,
      slug,
      schemeType: (row.schemeType as GovernmentSchemeType) || 'other',
      authorityName: typeof row.authorityName === 'string' ? row.authorityName : 'Authority',
      ministryDepartment:
        typeof row.ministryDepartment === 'string' ? row.ministryDepartment : 'Authority',
      description: typeof row.description === 'string' ? row.description : '',
      benefitSummary: typeof row.benefitSummary === 'string' ? row.benefitSummary : null,
      eligibilitySummary: typeof row.eligibilitySummary === 'string' ? row.eligibilitySummary : '',
      incomeLimitInr: null,
      loanLimitForSubventionInr: null,
      subventionRatePercent: null,
      subventionPeriodSummary: null,
      collateralRuleSummary:
        typeof row.collateralRuleSummary === 'string' ? row.collateralRuleSummary : null,
      guaranteeRuleSummary: null,
      eligibleStudyLocation: 'both',
      portalUrl: typeof row.portalUrl === 'string' ? row.portalUrl : officialSourceUrl,
      officialSourceUrl,
      officialGuidelinesUrl:
        typeof row.officialGuidelinesUrl === 'string'
          ? row.officialGuidelinesUrl
          : officialSourceUrl,
      lastVerifiedAt,
      effectiveFrom: typeof row.effectiveFrom === 'string' ? row.effectiveFrom : null,
      effectiveTo: typeof row.effectiveTo === 'string' ? row.effectiveTo : null,
      status: (row.status as GovernmentSchemeStatus) || 'published',
      keyRules: Array.isArray(row.keyRules)
        ? row.keyRules.filter((k): k is string => typeof k === 'string')
        : [],
      topicTags: Array.isArray(row.topicTags)
        ? row.topicTags.filter((k): k is string => typeof k === 'string')
        : [],
    });
  }
  return out.filter(isPublishedLapScheme);
}

export const LAP_DEFAULT_SCHEMES: LapGovernmentScheme[] = [
  {
    id: 'gov-rbi-secured-lending-overview',
    name: 'RBI — Secured Lending / Property-backed Credit (overview)',
    slug: 'rbi-secured-lending-overview',
    schemeType: 'other',
    authorityName: 'Reserve Bank of India',
    ministryDepartment: 'Reserve Bank of India',
    description:
      'The Reserve Bank of India publishes circulars and directions that may affect secured lending and related disclosure, valuation and recovery practices by regulated entities. Exact requirements are change-sensitive and must be read from the current official text.',
    benefitSummary:
      'Official regulatory framework context for secured/property-backed lending — not a product offer from Varnarc.',
    eligibilitySummary:
      'Applies in the context of regulated lenders as described in current RBI materials. Confirm applicability with the financing institution.',
    incomeLimitInr: null,
    loanLimitForSubventionInr: null,
    subventionRatePercent: null,
    subventionPeriodSummary: null,
    collateralRuleSummary:
      'Collateral, valuation, LTV and enforcement treatment are defined in current official directions and lender policy — Varnarc does not invent numerical caps here.',
    guaranteeRuleSummary: null,
    eligibleStudyLocation: 'both',
    portalUrl: 'https://www.rbi.org.in',
    officialSourceUrl: 'https://www.rbi.org.in',
    officialGuidelinesUrl: 'https://www.rbi.org.in',
    lastVerifiedAt: '2026-08-18',
    status: 'published',
    keyRules: [
      'Consult current RBI circulars/directions for secured lending',
      'Do not rely on outdated secondary summaries for numerical limits',
      'Lender policy still applies within the regulatory framework',
      'Varnarc is not a regulator or lender',
    ],
    topicTags: ['ltv', 'valuation', 'recovery', 'disclosure'],
  },
];

export function resolveLapGovernmentSchemes(cmsRaw: unknown): LapGovernmentScheme[] {
  const fromCms = parseLapGovernmentSchemesFromCms(cmsRaw);
  const base = fromCms.length ? fromCms : LAP_DEFAULT_SCHEMES.filter(isPublishedLapScheme);
  const now = new Date();
  return base.filter((s) => lapSchemeEffectiveWindow(s, now) !== 'ended');
}
