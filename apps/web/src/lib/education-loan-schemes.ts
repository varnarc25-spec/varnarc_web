/**
 * Education Loan government-scheme data layer + centralized eligibility evaluator.
 * Rules live in CMS/seed records with official source URLs — never as permanent
 * hardcoded business logic scattered across React components.
 */

export type GovernmentSchemeStatus = 'draft' | 'published' | 'archived';
export type GovernmentSchemeFreshness = 'fresh' | 'review_soon' | 'review_required' | 'archived';
export type GovernmentSchemeType =
  | 'interest_subvention'
  | 'interest_subsidy'
  | 'loan_portal'
  | 'scholarship'
  | 'guarantee'
  | 'other';

/** Public-facing match status — never APPROVED / REJECTED. */
export type SchemeEligibilityStatus =
  'potential_match' | 'may_be_relevant' | 'insufficient_information' | 'not_matched';

export type EducationGovernmentScheme = {
  id: string;
  name: string;
  slug: string;
  schemeType: GovernmentSchemeType;
  authorityName?: string | null;
  ministryDepartment: string;
  description: string;
  benefitSummary?: string | null;
  eligibilitySummary: string;
  /** Annual family income ceiling in INR, if a single scalar applies. */
  incomeLimitInr?: number | null;
  /** Loan principal ceiling for subvention/subsidy in INR, if applicable. */
  loanLimitForSubventionInr?: number | null;
  /** e.g. 3 for 3% subvention; null when full interest subsidy. */
  subventionRatePercent?: number | null;
  subventionPeriodSummary?: string | null;
  collateralRuleSummary?: string | null;
  guaranteeRuleSummary?: string | null;
  eligibleStudyLocation: 'india' | 'abroad' | 'both';
  eligibleInstitutionRule?: string | null;
  admissionRule?: string | null;
  courseRule?: string | null;
  portalUrl?: string | null;
  officialSourceUrl: string;
  officialGuidelinesUrl?: string | null;
  eligibleInstitutionSourceUrl?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  lastVerifiedAt: string;
  status: GovernmentSchemeStatus;
  contentJson?: Record<string, unknown> | null;
  keyRules: string[];
};

export type SchemeEligibilityInput = {
  studyLocation: 'india' | 'abroad';
  annualFamilyIncomeInr?: number | null;
  loanAmountInr?: number | null;
  meritBasedAdmission?: boolean | null;
  qheiEligible?: boolean | null;
  scholarshipAlreadyReceived?: boolean | null;
};

export type SchemeEligibilityResult = {
  scheme: EducationGovernmentScheme;
  status: SchemeEligibilityStatus;
  matchedConditions: string[];
  unmetConditions: string[];
  unknownConditions: string[];
  explanation: string;
  /** @deprecated use matched/unmet/unknown — kept for older callers */
  reasons: string[];
  freshness: GovernmentSchemeFreshness;
  showNumericRules: boolean;
};

/** Configurable freshness windows (days). */
export const GOVERNMENT_SCHEME_FRESHNESS_DAYS = {
  fresh: 90,
  reviewSoon: 180,
} as const;

export function governmentSchemeFreshness(
  lastVerifiedAt: string,
  now = new Date(),
  schemeStatus?: GovernmentSchemeStatus,
): GovernmentSchemeFreshness {
  if (schemeStatus === 'archived') return 'archived';
  const verified = new Date(lastVerifiedAt);
  if (!Number.isFinite(verified.getTime())) return 'review_required';
  const ageDays = (now.getTime() - verified.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= GOVERNMENT_SCHEME_FRESHNESS_DAYS.fresh) return 'fresh';
  if (ageDays <= GOVERNMENT_SCHEME_FRESHNESS_DAYS.reviewSoon) return 'review_soon';
  return 'review_required';
}

/** Public copy — do not expose editorial "Fresh / Review Soon" labels. */
export function formatSchemeVerifiedDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return 'Date unavailable';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function schemeEligibilityStatusLabel(status: SchemeEligibilityStatus): string {
  switch (status) {
    case 'potential_match':
      return 'Potential match';
    case 'may_be_relevant':
      return 'May be relevant';
    case 'insufficient_information':
      return 'More information required';
    case 'not_matched':
      return 'Not matched based on entered information';
  }
}

export function isPublishedGovernmentScheme(scheme: EducationGovernmentScheme): boolean {
  return scheme.status === 'published' && Boolean(scheme.officialSourceUrl?.trim());
}

export function schemeAllowsPublicNumericRules(freshness: GovernmentSchemeFreshness): boolean {
  return freshness === 'fresh' || freshness === 'review_soon';
}

/**
 * Centralized soft eligibility evaluator — never claims approval.
 * Distinguishes: potential_match | may_be_relevant | insufficient_information | not_matched
 */
export function evaluateGovernmentSchemeEligibility(
  scheme: EducationGovernmentScheme,
  input: SchemeEligibilityInput,
  now = new Date(),
): SchemeEligibilityResult {
  const freshness = governmentSchemeFreshness(scheme.lastVerifiedAt, now, scheme.status);
  const showNumericRules = schemeAllowsPublicNumericRules(freshness);
  const matchedConditions: string[] = [];
  const unmetConditions: string[] = [];
  const unknownConditions: string[] = [];

  const build = (status: SchemeEligibilityStatus, explanation: string): SchemeEligibilityResult => {
    const reasons = [
      ...matchedConditions.map((c) => `Matched: ${c}`),
      ...unmetConditions.map((c) => `Unmet: ${c}`),
      ...unknownConditions.map((c) => `Unknown: ${c}`),
      explanation,
    ];
    return {
      scheme,
      status,
      matchedConditions: [...matchedConditions],
      unmetConditions: [...unmetConditions],
      unknownConditions: [...unknownConditions],
      explanation,
      reasons,
      freshness,
      showNumericRules,
    };
  };

  if (scheme.status === 'archived' || freshness === 'archived') {
    return build(
      'insufficient_information',
      'This scheme record is archived. Check the official source for current status.',
    );
  }

  // Study location
  if (scheme.eligibleStudyLocation === 'india' && input.studyLocation === 'abroad') {
    unmetConditions.push('Study location (India-focused scheme)');
    return build(
      'not_matched',
      'Based on entered information, this scheme focuses on study in India.',
    );
  }
  if (scheme.eligibleStudyLocation === 'abroad' && input.studyLocation === 'india') {
    unmetConditions.push('Study location (abroad-focused scheme)');
    return build(
      'not_matched',
      'Based on entered information, this scheme focuses on study abroad.',
    );
  }
  if (
    scheme.eligibleStudyLocation === 'both' ||
    scheme.eligibleStudyLocation === input.studyLocation
  ) {
    matchedConditions.push(
      `Study location: ${input.studyLocation === 'india' ? 'India' : 'Abroad'}`,
    );
  }

  // Income
  if (input.annualFamilyIncomeInr == null || input.annualFamilyIncomeInr <= 0) {
    unknownConditions.push('Annual family income');
  } else if (scheme.incomeLimitInr != null && showNumericRules) {
    if (input.annualFamilyIncomeInr > scheme.incomeLimitInr) {
      unmetConditions.push('Family income within summarised scheme criterion');
    } else {
      matchedConditions.push('Family income within summarised scheme criterion');
    }
  } else if (scheme.incomeLimitInr != null && !showNumericRules) {
    unknownConditions.push('Income criterion (scheme details under review)');
  }

  // Loan amount (soft — over limit does not auto-exclude, but notes subvention cap)
  if (input.loanAmountInr == null || input.loanAmountInr <= 0) {
    unknownConditions.push('Loan requirement');
  } else if (scheme.loanLimitForSubventionInr != null && showNumericRules) {
    if (input.loanAmountInr > scheme.loanLimitForSubventionInr) {
      unknownConditions.push(
        'Loan amount vs subvention/subsidy principal ceiling — confirm with financing bank',
      );
    } else {
      matchedConditions.push('Loan amount within summarised subvention/subsidy principal ceiling');
    }
  }

  // Admission / institution (portal schemes)
  const needsMerit =
    Boolean(scheme.admissionRule?.toLowerCase().includes('merit')) ||
    scheme.slug === 'pm-vidyalaxmi';
  const needsQhei =
    Boolean(scheme.eligibleInstitutionRule?.toLowerCase().includes('qhei')) ||
    scheme.slug === 'pm-vidyalaxmi';

  if (needsMerit) {
    if (input.meritBasedAdmission === true) {
      matchedConditions.push('Merit-based admission indicated');
    } else if (input.meritBasedAdmission === false) {
      unmetConditions.push('Merit-based admission');
    } else {
      unknownConditions.push('Admission type (merit-based)');
    }
  }

  if (needsQhei) {
    if (input.qheiEligible === true) {
      matchedConditions.push('Institution indicated on official eligible list');
    } else if (input.qheiEligible === false) {
      unmetConditions.push('Institution on official eligible list');
    } else {
      unknownConditions.push('Institution eligibility (official list)');
    }
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
      'More information is required for a fuller check. Confirm eligibility on the official portal / with the financing bank.',
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
    'Based on the information entered, this scheme may be relevant. Confirm eligibility on the official portal / with the financing bank.',
  );
}

/** Spec / product alias. */
export const evaluateEducationScheme = evaluateGovernmentSchemeEligibility;
/** Legacy alias. */
export const evaluateEducationSchemeRelevance = evaluateGovernmentSchemeEligibility;

export function parseGovernmentSchemesFromCms(raw: unknown): EducationGovernmentScheme[] {
  if (!Array.isArray(raw)) return [];
  const out: EducationGovernmentScheme[] = [];
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
      eligibleStudyLocation:
        row.eligibleStudyLocation === 'abroad' || row.eligibleStudyLocation === 'both'
          ? row.eligibleStudyLocation
          : 'india',
      eligibleInstitutionRule:
        typeof row.eligibleInstitutionRule === 'string' ? row.eligibleInstitutionRule : null,
      admissionRule: typeof row.admissionRule === 'string' ? row.admissionRule : null,
      courseRule: typeof row.courseRule === 'string' ? row.courseRule : null,
      portalUrl: typeof row.portalUrl === 'string' ? row.portalUrl : null,
      officialSourceUrl,
      officialGuidelinesUrl:
        typeof row.officialGuidelinesUrl === 'string' ? row.officialGuidelinesUrl : null,
      eligibleInstitutionSourceUrl:
        typeof row.eligibleInstitutionSourceUrl === 'string'
          ? row.eligibleInstitutionSourceUrl
          : null,
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
    });
  }
  return out.filter(isPublishedGovernmentScheme);
}

/**
 * Seed / default schemes when CMS has none.
 * Re-verify before relying on numeric criteria in production communications.
 */
export const EDUCATION_LOAN_DEFAULT_SCHEMES: EducationGovernmentScheme[] = [
  {
    id: 'gov-pm-vidyalaxmi',
    name: 'PM-Vidyalaxmi',
    slug: 'pm-vidyalaxmi',
    schemeType: 'loan_portal',
    authorityName: 'Government of India',
    ministryDepartment: 'Ministry of Education / Department of Higher Education',
    description:
      'A unified government portal for education-loan applications and interest-subvention claims. Students may apply to participating banks through one active application (up to three banks, per official portal materials).',
    benefitSummary:
      'Portal access to participating banks; special collateral-free / guarantor-free product concepts for qualifying merit-based QHEI admissions; interest-subvention rules as published for eligible income bands.',
    eligibilitySummary:
      'Special collateral-free and guarantor-free loan product concepts apply for qualifying merit-based admissions to identified Quality Higher Educational Institutions (QHEI) in India. Exact eligibility is institute-, admission- and income-specific.',
    incomeLimitInr: 8_00_000,
    loanLimitForSubventionInr: 10_00_000,
    subventionRatePercent: 3,
    subventionPeriodSummary:
      'Official materials describe interest subvention during the moratorium for eligible students within defined family-income and principal ceilings. Confirm current portal wording before relying on any percentage.',
    collateralRuleSummary:
      'Special product summarised as collateral-free and guarantor-free for qualifying merit-based QHEI admissions — confirm product letter and bank terms.',
    guaranteeRuleSummary: null,
    eligibleStudyLocation: 'india',
    eligibleInstitutionRule:
      'Institution must appear on the official QHEI / eligible-institution list.',
    admissionRule: 'Merit-based admission to eligible institutions.',
    courseRule: 'As defined in current scheme guidelines / portal.',
    portalUrl: 'https://pmvidyalaxmi.co.in',
    officialSourceUrl: 'https://pmvidyalaxmi.co.in',
    officialGuidelinesUrl: 'https://www.education.gov.in',
    eligibleInstitutionSourceUrl: 'https://pmvidyalaxmi.co.in',
    effectiveFrom: '2024-11-06',
    effectiveTo: null,
    lastVerifiedAt: '2026-08-17',
    status: 'published',
    contentJson: {
      maxBanksPerApplication: 3,
      repaymentTenureNote:
        'Guidelines have described repayment of up to 15 years excluding moratorium (course period + one year) — verify current guidelines.',
    },
    keyRules: [
      'Unified portal for education-loan applications and subvention claims',
      'Apply to up to three participating banks within one active application (per portal materials)',
      'Special collateral-/guarantor-free product for qualifying merit-based QHEI admissions in India',
      'Interest-subvention rules are income- and principal-capped and can change',
      'Always confirm QHEI list and rules on the official portal',
    ],
  },
  {
    id: 'gov-pm-usp-csis',
    name: 'PM-USP Central Sector Interest Subsidy (CSIS)',
    slug: 'pm-usp-csis',
    schemeType: 'interest_subsidy',
    authorityName: 'Government of India',
    ministryDepartment: 'Ministry of Education / Department of Higher Education',
    description:
      'Central Sector Interest Subsidy Scheme providing full interest subsidy during the moratorium for eligible education loans for specified study in India, subject to income and course conditions in official guidelines.',
    benefitSummary:
      'Full interest subsidy during the moratorium for eligible borrowers, subject to current Ministry guidelines.',
    eligibilitySummary:
      'Eligible borrowers with annual parental/family income within the guideline criterion for specified study in India, subject to current Ministry guidelines.',
    incomeLimitInr: 4_50_000,
    loanLimitForSubventionInr: 10_00_000,
    subventionRatePercent: null,
    subventionPeriodSummary:
      'Full interest subsidy during the moratorium period for eligible borrowers, as described in current guidelines.',
    collateralRuleSummary:
      'Guidelines note no collateral / third-party guarantee for loans up to a defined amount under the linked guarantee arrangement — confirm current guidelines.',
    guaranteeRuleSummary:
      'Linked credit-guarantee arrangement may apply for certain loan amounts under scheme conditions.',
    eligibleStudyLocation: 'india',
    eligibleInstitutionRule: 'As defined in current CSIS / Ministry guidelines.',
    admissionRule: null,
    courseRule: 'Specified eligible courses / study conditions in official guidelines.',
    portalUrl: null,
    officialSourceUrl: 'https://www.education.gov.in',
    officialGuidelinesUrl: 'https://www.education.gov.in',
    eligibleInstitutionSourceUrl: null,
    effectiveFrom: null,
    effectiveTo: null,
    lastVerifiedAt: '2026-08-17',
    status: 'published',
    contentJson: null,
    keyRules: [
      'Full interest subsidy during moratorium for eligible borrowers',
      'Annual parental/family income criterion applies per current guidelines',
      'Subsidy applies up to the scheme-defined loan amount',
      'Distinct from PM-Vidyalaxmi — do not merge the two mechanisms',
      'Confirm course eligibility and bank claim process on official sources',
    ],
  },
];

export function resolveEducationGovernmentSchemes(cmsRaw: unknown): EducationGovernmentScheme[] {
  const fromCms = parseGovernmentSchemesFromCms(cmsRaw);
  return fromCms.length
    ? fromCms
    : EDUCATION_LOAN_DEFAULT_SCHEMES.filter(isPublishedGovernmentScheme);
}

export function findEducationSchemeBySlug(
  schemes: EducationGovernmentScheme[],
  slug: string,
): EducationGovernmentScheme | null {
  return schemes.find((s) => s.slug === slug) ?? null;
}
