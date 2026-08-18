/**
 * Gold Loan regulatory / educational scheme records.
 * Reuses freshness helpers from education schemes (shared architecture).
 *
 * Do NOT invent current RBI numerical LTV caps here. Seed content is educational
 * and points users to official sources; specific numbers only when CMS-verified.
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

export type GoldGovernmentScheme = EducationGovernmentScheme & {
  topicTags?: string[];
};

export type GoldSchemeEligibilityInput = {
  hasGoldToPledge?: boolean | null;
  karatKnown?: boolean | null;
  locationIndia?: boolean | null;
  requiredLoanInr?: number | null;
};

export type GoldSchemeEligibilityResult = {
  scheme: GoldGovernmentScheme;
  status: SchemeEligibilityStatus;
  matchedConditions: string[];
  unmetConditions: string[];
  unknownConditions: string[];
  explanation: string;
  freshness: GovernmentSchemeFreshness;
  showNumericRules: boolean;
};

export function isPublishedGoldScheme(scheme: GoldGovernmentScheme): boolean {
  return isPublishedBase(scheme);
}

export function goldSchemeEffectiveWindow(
  scheme: GoldGovernmentScheme,
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

export function evaluateGoldSchemeRelevance(
  scheme: GoldGovernmentScheme,
  input: GoldSchemeEligibilityInput,
  now = new Date(),
): GoldSchemeEligibilityResult {
  const freshness = governmentSchemeFreshness(scheme.lastVerifiedAt, now, scheme.status);
  const showNumericRules = schemeAllowsPublicNumericRules(freshness);
  const matchedConditions: string[] = [];
  const unmetConditions: string[] = [];
  const unknownConditions: string[] = [];

  const build = (
    status: SchemeEligibilityStatus,
    explanation: string,
  ): GoldSchemeEligibilityResult => ({
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
      'This regulatory record is archived. Check the official source for current status.',
    );
  }

  const windowState = goldSchemeEffectiveWindow(scheme, now);
  if (windowState === 'ended') {
    return build(
      'not_matched',
      'This record appears outside its effective period. Confirm current requirements on the official source.',
    );
  }
  if (windowState === 'future') {
    return build(
      'insufficient_information',
      'This record is not yet within its effective period. Confirm timing on the official source.',
    );
  }

  if (!scheme.officialSourceUrl?.trim() || !scheme.lastVerifiedAt?.trim()) {
    return build(
      'insufficient_information',
      'This record is missing an official source or last-verified date and cannot be treated as verified here.',
    );
  }

  if (input.locationIndia === false) {
    unmetConditions.push('India-focused regulatory context (summarised)');
    return build(
      'not_matched',
      'Based on entered information, this summarised material focuses on Indian regulatory context. Confirm on the official source.',
    );
  }
  if (input.locationIndia === true) {
    matchedConditions.push('India-based context indicated');
  } else {
    unknownConditions.push('Location context');
  }

  if (input.hasGoldToPledge == null) {
    unknownConditions.push('Whether gold is available to pledge');
  } else if (input.hasGoldToPledge) {
    matchedConditions.push('Gold pledge scenario indicated');
  }

  if (input.karatKnown == null) {
    unknownConditions.push('Gold purity information');
  } else if (input.karatKnown) {
    matchedConditions.push('Purity information available for planning');
  }

  if (input.requiredLoanInr == null || input.requiredLoanInr <= 0) {
    unknownConditions.push('Required loan amount');
  }

  if (unmetConditions.length > 0) {
    return build(
      'not_matched',
      'Based on the information entered, one or more summarised conditions are not met. Confirm on the official source.',
    );
  }
  if (unknownConditions.length > 0) {
    return build(
      'insufficient_information',
      'More information is required for a fuller check. Confirm relevance on the official source.',
    );
  }
  if (matchedConditions.length >= 2) {
    return build(
      'potential_match',
      'Based on the information entered, this topic may be a potential match for your planning. Official verification is still required.',
    );
  }
  return build(
    'may_be_relevant',
    'Based on the information entered, this topic may be relevant. Confirm on the official source.',
  );
}

export function parseGoldGovernmentSchemesFromCms(raw: unknown): GoldGovernmentScheme[] {
  if (!Array.isArray(raw)) return [];
  const out: GoldGovernmentScheme[] = [];
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
        typeof row.ministryDepartment === 'string'
          ? row.ministryDepartment
          : 'Reserve Bank of India',
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
      topicTags: Array.isArray(row.topicTags)
        ? row.topicTags.filter((r): r is string => typeof r === 'string')
        : [],
    });
  }
  return out.filter(isPublishedGoldScheme);
}

/**
 * Educational seed pointing to RBI — no invented numerical LTV caps.
 * Specific thresholds must come from CMS records with official sources.
 */
export const GOLD_LOAN_DEFAULT_SCHEMES: GoldGovernmentScheme[] = [
  {
    id: 'gov-rbi-gold-loan-overview',
    name: 'RBI — Gold Loan / Lending Against Gold (overview)',
    slug: 'rbi-gold-loan-overview',
    schemeType: 'other',
    authorityName: 'Reserve Bank of India',
    ministryDepartment: 'Reserve Bank of India',
    description:
      'The Reserve Bank of India publishes circulars and directions that may affect lending against gold jewellery by regulated entities. Exact requirements, including any LTV-related provisions, are change-sensitive and must be read from the current official text.',
    benefitSummary:
      'Official regulatory framework for gold-backed lending by regulated entities — not a product offer from Varnarc.',
    eligibilitySummary:
      'Applies in the context of regulated lenders as described in current RBI materials. Confirm applicability with the financing institution.',
    incomeLimitInr: null,
    loanLimitForSubventionInr: null,
    subventionRatePercent: null,
    subventionPeriodSummary: null,
    collateralRuleSummary:
      'Collateral, valuation and LTV treatment are defined in current official directions and lender policy — Varnarc does not invent numerical caps here.',
    guaranteeRuleSummary: null,
    eligibleStudyLocation: 'both',
    portalUrl: 'https://www.rbi.org.in',
    officialSourceUrl: 'https://www.rbi.org.in',
    officialGuidelinesUrl: 'https://www.rbi.org.in',
    lastVerifiedAt: '2026-08-18',
    status: 'published',
    keyRules: [
      'Consult current RBI circulars/directions for gold loans',
      'Do not rely on outdated secondary summaries for numerical limits',
      'Lender policy still applies within the regulatory framework',
      'Varnarc is not a regulator or lender',
    ],
    topicTags: ['ltv', 'valuation', 'auction', 'customer_protection'],
  },
];

export function resolveGoldGovernmentSchemes(cmsRaw: unknown): GoldGovernmentScheme[] {
  const fromCms = parseGoldGovernmentSchemesFromCms(cmsRaw);
  const base = fromCms.length ? fromCms : GOLD_LOAN_DEFAULT_SCHEMES.filter(isPublishedGoldScheme);
  const now = new Date();
  return base.filter((s) => goldSchemeEffectiveWindow(s, now) !== 'ended');
}

export function findGoldSchemeBySlug(
  schemes: GoldGovernmentScheme[],
  slug: string,
): GoldGovernmentScheme | null {
  return schemes.find((s) => s.slug === slug) ?? null;
}
