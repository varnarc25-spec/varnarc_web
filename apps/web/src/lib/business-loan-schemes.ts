/**
 * Business / MSME government-scheme data + soft eligibility evaluator.
 * Reuses freshness helpers from the education schemes module (shared architecture).
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

export type BusinessGovernmentScheme = EducationGovernmentScheme & {
  /** Soft tags for finder (not hard underwriting). */
  purposeHints?: string[];
  enterpriseCategoryHints?: string[];
};

export type BusinessSchemeEligibilityInput = {
  fundingPurpose?: string | null;
  loanAmountInr?: number | null;
  businessVintageYears?: number | null;
  enterpriseCategory?: 'micro' | 'small' | 'medium' | 'not_sure' | null;
  locationIndia?: boolean | null;
};

export type BusinessSchemeEligibilityResult = {
  scheme: BusinessGovernmentScheme;
  status: SchemeEligibilityStatus;
  matchedConditions: string[];
  unmetConditions: string[];
  unknownConditions: string[];
  explanation: string;
  freshness: GovernmentSchemeFreshness;
  showNumericRules: boolean;
};

export function isPublishedBusinessScheme(scheme: BusinessGovernmentScheme): boolean {
  return isPublishedBase(scheme);
}

/** Respect effectiveFrom / effectiveTo when present. */
export function businessSchemeEffectiveWindow(
  scheme: BusinessGovernmentScheme,
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

export function evaluateBusinessSchemeEligibility(
  scheme: BusinessGovernmentScheme,
  input: BusinessSchemeEligibilityInput,
  now = new Date(),
): BusinessSchemeEligibilityResult {
  const freshness = governmentSchemeFreshness(scheme.lastVerifiedAt, now, scheme.status);
  const showNumericRules = schemeAllowsPublicNumericRules(freshness);
  const matchedConditions: string[] = [];
  const unmetConditions: string[] = [];
  const unknownConditions: string[] = [];

  const build = (
    status: SchemeEligibilityStatus,
    explanation: string,
  ): BusinessSchemeEligibilityResult => ({
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
      'This scheme record is archived. Check the official source for current status.',
    );
  }

  const windowState = businessSchemeEffectiveWindow(scheme, now);
  if (windowState === 'ended') {
    return build(
      'not_matched',
      'This scheme record appears outside its effective period (historical / ended). Confirm current status on the official source.',
    );
  }
  if (windowState === 'future') {
    return build(
      'insufficient_information',
      'This scheme record is not yet within its effective period. Confirm timing on the official source.',
    );
  }

  if (!scheme.officialSourceUrl?.trim() || !scheme.lastVerifiedAt?.trim()) {
    return build(
      'insufficient_information',
      'This scheme record is missing an official source or last-verified date and cannot be treated as verified here.',
    );
  }

  if (input.locationIndia === false) {
    unmetConditions.push('India-based enterprise focus (summarised)');
    return build(
      'not_matched',
      'Based on entered information, this summarised support focuses on Indian enterprises. Confirm on the official source.',
    );
  }
  if (input.locationIndia === true) {
    matchedConditions.push('India-based enterprise indicated');
  } else {
    unknownConditions.push('Business location');
  }

  if (input.loanAmountInr == null || input.loanAmountInr <= 0) {
    unknownConditions.push('Loan requirement');
  } else if (scheme.loanLimitForSubventionInr != null && showNumericRules) {
    if (input.loanAmountInr > scheme.loanLimitForSubventionInr) {
      unknownConditions.push(
        'Loan amount vs summarised scheme ceiling — confirm with financing bank',
      );
    } else {
      matchedConditions.push('Loan amount within summarised scheme ceiling');
    }
  }

  if (input.enterpriseCategory == null || input.enterpriseCategory === 'not_sure') {
    unknownConditions.push('Enterprise category (Micro / Small / Medium)');
  } else if (scheme.enterpriseCategoryHints?.length) {
    if (scheme.enterpriseCategoryHints.includes(input.enterpriseCategory)) {
      matchedConditions.push(`Enterprise category: ${input.enterpriseCategory}`);
    } else {
      unmetConditions.push('Enterprise category within summarised scheme audience');
    }
  }

  if (input.fundingPurpose && scheme.purposeHints?.length) {
    if (scheme.purposeHints.includes(input.fundingPurpose)) {
      matchedConditions.push('Funding purpose may align with summarised scheme focus');
    } else {
      unknownConditions.push('Funding purpose vs scheme focus — confirm officially');
    }
  }

  if (input.businessVintageYears == null) {
    unknownConditions.push('Business vintage');
  } else {
    matchedConditions.push('Business vintage provided for lender/scheme context');
  }

  if (unmetConditions.length > 0) {
    return build(
      'not_matched',
      'Based on the information entered, one or more summarised conditions are not met. Confirm on the official portal / with the financing bank.',
    );
  }
  if (unknownConditions.length > 0) {
    return build(
      'insufficient_information',
      'More information is required for a fuller check. Confirm relevance on the official source / with the financing bank.',
    );
  }
  if (matchedConditions.length >= 2) {
    return build(
      'potential_match',
      'Based on the information entered, this scheme may be a potential match. Official verification is still required.',
    );
  }
  return build(
    'may_be_relevant',
    'Based on the information entered, this scheme may be relevant. Confirm on the official source / with the financing bank.',
  );
}

export function parseBusinessGovernmentSchemesFromCms(raw: unknown): BusinessGovernmentScheme[] {
  if (!Array.isArray(raw)) return [];
  const out: BusinessGovernmentScheme[] = [];
  for (const item of raw) {
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
      authorityName: typeof row.authorityName === 'string' ? row.authorityName : null,
      ministryDepartment:
        typeof row.ministryDepartment === 'string' ? row.ministryDepartment : 'Government of India',
      description: typeof row.description === 'string' ? row.description : '',
      benefitSummary: typeof row.benefitSummary === 'string' ? row.benefitSummary : null,
      eligibilitySummary: typeof row.eligibilitySummary === 'string' ? row.eligibilitySummary : '',
      incomeLimitInr: typeof row.incomeLimitInr === 'number' ? row.incomeLimitInr : null,
      loanLimitForSubventionInr:
        typeof row.loanLimitForSubventionInr === 'number' ? row.loanLimitForSubventionInr : null,
      subventionRatePercent:
        typeof row.subventionRatePercent === 'number' ? row.subventionRatePercent : null,
      subventionPeriodSummary:
        typeof row.subventionPeriodSummary === 'string' ? row.subventionPeriodSummary : null,
      collateralRuleSummary:
        typeof row.collateralRuleSummary === 'string' ? row.collateralRuleSummary : null,
      guaranteeRuleSummary:
        typeof row.guaranteeRuleSummary === 'string' ? row.guaranteeRuleSummary : null,
      eligibleStudyLocation: 'both',
      portalUrl: typeof row.portalUrl === 'string' ? row.portalUrl : null,
      officialSourceUrl,
      officialGuidelinesUrl:
        typeof row.officialGuidelinesUrl === 'string' ? row.officialGuidelinesUrl : null,
      eligibleInstitutionSourceUrl: null,
      effectiveFrom: typeof row.effectiveFrom === 'string' ? row.effectiveFrom : null,
      effectiveTo: typeof row.effectiveTo === 'string' ? row.effectiveTo : null,
      lastVerifiedAt,
      status: row.status === 'draft' || row.status === 'archived' ? row.status : 'published',
      contentJson:
        row.contentJson && typeof row.contentJson === 'object'
          ? (row.contentJson as Record<string, unknown>)
          : null,
      keyRules: Array.isArray(row.keyRules)
        ? row.keyRules.filter((r): r is string => typeof r === 'string')
        : [],
      purposeHints: Array.isArray(row.purposeHints)
        ? row.purposeHints.filter((r): r is string => typeof r === 'string')
        : [],
      enterpriseCategoryHints: Array.isArray(row.enterpriseCategoryHints)
        ? row.enterpriseCategoryHints.filter((r): r is string => typeof r === 'string')
        : [],
    });
  }
  return out.filter(isPublishedBusinessScheme);
}

export const BUSINESS_LOAN_DEFAULT_SCHEMES: BusinessGovernmentScheme[] = [
  {
    id: 'gov-udyam',
    name: 'Udyam Registration (MSME)',
    slug: 'udyam-registration',
    schemeType: 'other',
    authorityName: 'Government of India',
    ministryDepartment: 'Ministry of Micro, Small and Medium Enterprises',
    description:
      'Udyam is the official MSME registration framework. Registration may be relevant for accessing certain MSME-oriented financing and scheme pathways — confirm current benefits on official sources.',
    benefitSummary:
      'Official MSME classification/registration. Specific financing benefits depend on linked schemes and lender products.',
    eligibilitySummary:
      'Enterprises that meet current MSME classification criteria as published by the Ministry. Exact classification rules are change-sensitive.',
    incomeLimitInr: null,
    loanLimitForSubventionInr: null,
    subventionRatePercent: null,
    subventionPeriodSummary: null,
    collateralRuleSummary: null,
    guaranteeRuleSummary: null,
    eligibleStudyLocation: 'both',
    portalUrl: 'https://udyamregistration.gov.in',
    officialSourceUrl: 'https://udyamregistration.gov.in',
    officialGuidelinesUrl: 'https://msme.gov.in',
    lastVerifiedAt: '2026-08-17',
    status: 'published',
    keyRules: [
      'Official MSME registration portal',
      'Classification and linked benefits can change',
      'Varnarc is not the Udyam registration portal',
      'Always verify on the official website',
    ],
    purposeHints: ['working_capital', 'equipment', 'expansion', 'inventory'],
    enterpriseCategoryHints: ['micro', 'small', 'medium'],
  },
  {
    id: 'gov-cgtmse',
    name: 'Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)',
    slug: 'cgtmse',
    schemeType: 'guarantee',
    authorityName: 'Government of India / CGTMSE',
    ministryDepartment: 'Ministry of Micro, Small and Medium Enterprises / SIDBI framework',
    description:
      'A credit-guarantee framework that may support collateral-free lending concepts for eligible micro and small enterprises through member lending institutions, subject to current CGTMSE guidelines.',
    benefitSummary:
      'Credit guarantee support for eligible facilities as described in current CGTMSE guidelines — not a direct cash subsidy from Varnarc.',
    eligibilitySummary:
      'Typically oriented to eligible micro and small enterprises and member institutions. Exact coverage, ceilings and conditions are change-sensitive.',
    incomeLimitInr: null,
    loanLimitForSubventionInr: null,
    subventionRatePercent: null,
    subventionPeriodSummary: null,
    collateralRuleSummary:
      'Guidelines describe guarantee-backed collateral-free concepts for defined cases — confirm with the financing bank and current CGTMSE materials.',
    guaranteeRuleSummary:
      'Guarantee coverage percentages and exclusions are defined in current scheme guidelines.',
    eligibleStudyLocation: 'both',
    portalUrl: 'https://www.cgtmse.in',
    officialSourceUrl: 'https://www.cgtmse.in',
    officialGuidelinesUrl: 'https://www.cgtmse.in',
    lastVerifiedAt: '2026-08-17',
    status: 'published',
    keyRules: [
      'Credit guarantee framework for eligible MSE lending',
      'Member lending institutions administer linked facilities',
      'Coverage ceilings and exclusions change — verify officially',
      'Distinct from Udyam registration itself',
    ],
    purposeHints: ['working_capital', 'equipment', 'expansion', 'inventory', 'cash_flow_gap'],
    enterpriseCategoryHints: ['micro', 'small'],
  },
];

export function resolveBusinessGovernmentSchemes(cmsRaw: unknown): BusinessGovernmentScheme[] {
  const fromCms = parseBusinessGovernmentSchemesFromCms(cmsRaw);
  const base = fromCms.length
    ? fromCms
    : BUSINESS_LOAN_DEFAULT_SCHEMES.filter(isPublishedBusinessScheme);
  const now = new Date();
  // Ended schemes must not silently appear as currently available in the finder.
  return base.filter((s) => businessSchemeEffectiveWindow(s, now) !== 'ended');
}

export function findBusinessSchemeBySlug(
  schemes: BusinessGovernmentScheme[],
  slug: string,
): BusinessGovernmentScheme | null {
  return schemes.find((s) => s.slug === slug) ?? null;
}
