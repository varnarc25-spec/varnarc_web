import { calculatorHref, isKnownCalculatorSlug } from '@/lib/finance-routes';
import type { LoanCategorySlug } from '@/lib/loan-hub-categories';
import type { ContextualLink } from '@/lib/loan-contextual-links';
import { PERSONAL_LOAN_INTRO } from '@/lib/personal-loan-page';

export type { LoanCategorySlug };

export type LoanCategorySectionLayout =
  'prose' | 'stepper' | 'factor-cards' | 'compare-table' | 'checklist' | 'pros-cons';

export type LoanCategorySection = {
  key: string;
  title: string;
  body: string;
  /** Visual presentation for category education (titles/layouts stay in code; CMS overrides body). */
  layout?: LoanCategorySectionLayout;
  steps?: string[];
  factors?: Array<{ title: string; detail: string }>;
  compareHeaders?: [string, string];
  compareRows?: Array<{ label: string; left: string; right: string }>;
  checklist?: string[];
  pros?: string[];
  cons?: string[];
};

export type LoanCategoryPageCopy = {
  h1: string;
  /** Breadcrumb trail label (may differ from CMS singular name). */
  breadcrumbLabel: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  sections: LoanCategorySection[];
  relatedCalculators: ContextualLink[];
  defaultFaqs: Array<{ question: string; answer: string }>;
};

function calc(slug: Parameters<typeof calculatorHref>[0], label: string): ContextualLink {
  return { label, href: calculatorHref(slug) };
}

/** Ordered education sections + SEO defaults per loan hub category. CMS overrides when present. */
export const LOAN_CATEGORY_PAGE_DEFAULTS: Record<LoanCategorySlug, LoanCategoryPageCopy> = {
  'personal-loan': {
    h1: 'Compare Personal Loans',
    breadcrumbLabel: 'Personal Loans',
    intro: PERSONAL_LOAN_INTRO,
    metaTitle: 'Compare Personal Loans | Rates, EMI & Eligibility',
    metaDescription:
      'Compare personal loan interest rates, amounts, tenure, processing fees and eligibility from banks and NBFCs. Estimate EMI before you apply.',
    relatedCalculators: [
      calc('personal-loan-emi', 'Personal Loan EMI Calculator'),
      calc('loan-eligibility', 'Loan Eligibility Calculator'),
      calc('loan-prepayment', 'Loan Prepayment Calculator'),
      calc('debt-planner', 'Debt-to-Income / EMI Burden Calculator'),
      calc('emi-rate-compare', 'Interest Rate Comparison Calculator'),
    ],
    sections: [
      {
        key: 'whatIs',
        title: 'What is a Personal Loan?',
        layout: 'prose',
        body: 'A personal loan is typically an unsecured credit facility for personal expenses such as medical needs, travel, education support, debt consolidation or home improvements. Approval and pricing usually depend on income, credit profile and lender policy — not on pledged collateral.',
      },
      {
        key: 'howItWorks',
        title: 'How Personal Loans Work',
        layout: 'stepper',
        body: 'After application and verification, lenders may sanction an amount and tenure. Disbursal is often to your bank account. You repay through EMIs that cover principal and interest. Always confirm final terms in the sanction letter before accepting.',
        steps: [
          'Apply with KYC and income details',
          'Lender verifies profile and credit',
          'Sanction letter confirms amount, rate and tenure',
          'Funds disburse to your account',
          'Repay via scheduled EMIs',
        ],
      },
      {
        key: 'interestRates',
        title: 'Personal Loan Interest Rates',
        layout: 'prose',
        body: 'Displayed rates on comparison pages are starting or illustrative figures where verified. Your offered rate can differ based on credit score, income stability, existing obligations and lender risk assessment. Compare total cost, not only the headline rate.',
      },
      {
        key: 'rateFactors',
        title: 'What Affects Your Rate?',
        layout: 'factor-cards',
        body: 'Lenders price personal loans from risk and product rules. Improving one factor helps, but offers still vary by bank or NBFC policy.',
        factors: [
          { title: 'Credit score', detail: 'Stronger history can improve pricing odds.' },
          { title: 'Income stability', detail: 'Steady salary or business cash flow matters.' },
          { title: 'Existing EMIs', detail: 'High obligations can tighten offers.' },
          { title: 'Employment type', detail: 'Salaried vs self-employed policies differ.' },
          { title: 'Loan amount & tenure', detail: 'Ticket size and term affect risk.' },
          { title: 'Relationship & offers', detail: 'Existing customers may see different rates.' },
        ],
      },
      {
        key: 'eligibility',
        title: 'Eligibility',
        layout: 'checklist',
        body: 'Common factors include age, employment type, minimum income, work experience, residence stability and credit history. Each lender publishes its own criteria — use eligibility tools only as indicative checks, not as approval guarantees.',
        checklist: [
          'Age within lender-stated limits',
          'Minimum income / turnover threshold',
          'Stable employment or business vintage',
          'Acceptable credit profile',
          'Manageable existing obligations',
        ],
      },
      {
        key: 'documents',
        title: 'Documents Required',
        layout: 'checklist',
        body: 'Typical document sets include identity and address proof, income documents (salary slips or ITRs), bank statements and photographs. Self-employed applicants may need business proofs. Exact lists differ by lender and profile.',
        checklist: [
          'Identity and address proof (KYC)',
          'Income proofs (salary slips / ITR)',
          'Recent bank statements',
          'Photographs as required',
          'Business proofs for self-employed (if asked)',
        ],
      },
      {
        key: 'fees',
        title: 'Fees & Charges',
        layout: 'checklist',
        body: 'Beyond interest, review processing fees, GST where applicable, foreclosure or prepayment charges, late payment fees and any documentation charges. Missing fee data on a listing means it is not currently verified — confirm with the lender.',
        checklist: [
          'Processing fee (and GST if applicable)',
          'Prepayment / foreclosure charges',
          'Late payment or bounce fees',
          'Documentation or other admin charges',
        ],
      },
      {
        key: 'emiCalculation',
        title: 'EMI',
        layout: 'prose',
        body: 'EMI depends on principal, annual interest rate and tenure. Use an EMI calculator to compare scenarios. Illustrative EMIs are not offers; actual schedules follow the lender’s reducing-balance method and sanction terms.',
      },
      {
        key: 'creditScore',
        title: 'Credit Score',
        layout: 'prose',
        body: 'A stronger credit score can improve approval odds and pricing for unsecured personal loans. Lenders may also review repayment history, credit utilisation and recent enquiries. Improving score quality before applying can help, but results vary by lender.',
      },
      {
        key: 'tenure',
        title: 'Tenure',
        layout: 'compare-table',
        body: 'Shorter tenure raises EMI but usually lowers total interest. Longer tenure eases monthly outflow but can increase overall cost. Match tenure to cash flow — not only to the lowest EMI.',
        compareHeaders: ['Shorter tenure', 'Longer tenure'],
        compareRows: [
          { label: 'Monthly EMI', left: 'Higher', right: 'Lower' },
          { label: 'Total interest', left: 'Often lower', right: 'Often higher' },
          { label: 'Cash-flow fit', left: 'Needs stronger surplus', right: 'Easier monthly fit' },
        ],
      },
      {
        key: 'prepayment',
        title: 'Prepayment',
        layout: 'prose',
        body: 'Some personal loans allow part-prepayment or foreclosure with or without charges after a lock-in. Check whether savings on interest outweigh fees, and whether prepayment reduces EMI or tenure.',
      },
      {
        key: 'alternatives',
        title: 'Personal Loan vs Credit Card',
        layout: 'compare-table',
        body: 'Personal loans usually offer fixed tenure EMIs for larger amounts. Credit cards suit shorter revolving spends but can be costlier if balances roll at high rates.',
        compareHeaders: ['Personal loan', 'Credit card'],
        compareRows: [
          { label: 'Best for', left: 'Larger planned amounts', right: 'Short revolving spends' },
          { label: 'Repayment', left: 'Fixed EMI schedule', right: 'Minimum due / revolving' },
          { label: 'Cost clarity', left: 'Rate + fees upfront', right: 'High if balance rolls' },
        ],
      },
      {
        key: 'vsLap',
        title: 'Personal Loan vs Loan Against Property',
        layout: 'compare-table',
        body: 'Personal loans are generally unsecured and faster for smaller tickets. Loan against property uses collateral and may support larger amounts or different pricing — with asset risk if you default.',
        compareHeaders: ['Personal loan', 'Loan against property'],
        compareRows: [
          { label: 'Collateral', left: 'Usually none', right: 'Property pledged' },
          { label: 'Typical ticket', left: 'Lower to mid', right: 'Often higher' },
          { label: 'Risk if default', left: 'Credit / recovery', right: 'Asset at risk' },
        ],
      },
      {
        key: 'advantages',
        title: 'Advantages & Considerations',
        layout: 'pros-cons',
        body: 'Personal loans can fund needs without selling investments — but unsecured pricing and fees still deserve careful comparison.',
        pros: [
          'No collateral in most cases',
          'Predictable EMI schedule',
          'Useful for consolidation or planned expenses',
        ],
        cons: [
          'Rates can be higher than secured products',
          'Fees and GST add to total cost',
          'Over-borrowing hurts future eligibility',
        ],
      },
      {
        key: 'mistakes',
        title: 'Common Mistakes',
        layout: 'checklist',
        body: 'Avoid comparing only the headline rate. Confirm fees, tenure fit, and repayment capacity before you apply.',
        checklist: [
          'Ignoring processing and foreclosure fees',
          'Choosing tenure only for the lowest EMI',
          'Applying to many lenders at once without need',
          'Borrowing more than the planned use-case',
          'Skipping the sanction-letter review',
        ],
      },
      {
        key: 'howToApply',
        title: 'Application Process',
        layout: 'stepper',
        body: 'A typical personal loan journey is short, but each lender’s verification steps can differ. Keep documents ready and read the sanction letter carefully.',
        steps: [
          'Shortlist products that fit amount and tenure',
          'Check eligibility and gather documents',
          'Submit application with accurate details',
          'Complete verification / KYC as asked',
          'Review sanction terms, then accept disbursal',
        ],
      },
    ],
    defaultFaqs: [
      {
        question: 'Are personal loan rates on this page final offers?',
        answer:
          'No. Listed rates are informational and may be starting or last-verified figures. Your actual rate depends on lender assessment and sanction terms.',
      },
      {
        question: 'Do I need collateral for a personal loan?',
        answer:
          'Most personal loans are unsecured. Some lenders may still request guarantors or additional checks depending on profile and policy.',
      },
      {
        question: 'Can I calculate EMI before applying?',
        answer:
          'Yes. Use the Personal Loan EMI Calculator with an illustrative amount, rate and tenure. Results are estimates only.',
      },
      {
        question: 'What documents are usually required?',
        answer:
          'KYC, income proofs, and bank statements are common. Self-employed applicants may need business proofs. Exact lists vary by lender.',
      },
      {
        question: 'Does a higher credit score guarantee a lower rate?',
        answer:
          'No. A stronger score can improve odds, but income, obligations, employment type and lender policy also matter.',
      },
      {
        question: 'Can I prepay a personal loan early?',
        answer:
          'Many lenders allow part-prepayment or foreclosure, sometimes after a lock-in and sometimes with charges. Confirm the product’s current policy.',
      },
    ],
  },
  'home-loan': {
    h1: 'Compare Home Loans',
    breadcrumbLabel: 'Home Loans',
    intro:
      'Compare home loan interest rates, loan amounts, tenure, processing fees, LTV and eligibility for buying or building a home.',
    metaTitle: 'Compare Home Loans | Rates, EMI, LTV & Eligibility',
    metaDescription:
      'Compare home loan rates, EMI, tenure, processing fees, loan-to-value and eligibility across banks and housing finance companies.',
    relatedCalculators: [
      calc('home-loan-emi', 'Home Loan EMI Calculator'),
      calc('loan-eligibility', 'Home Loan Eligibility Calculator'),
      calc('loan-prepayment', 'Prepayment Calculator'),
      // Balance transfer calculator not seeded — omit broken link.
    ],
    sections: [
      {
        key: 'whatIs',
        title: 'What is a Home Loan?',
        body: 'A home loan finances purchase, construction or renovation of residential property. The property typically remains mortgaged until the loan is repaid. Tenure can extend over many years, so total interest cost and rate type matter as much as EMI size.',
      },
      {
        key: 'interestRates',
        title: 'Home Loan Interest Rates',
        body: 'Home loan rates may be linked to external or internal benchmarks. Published starting rates are not universal offers. Compare reset frequency, spread and fees alongside the headline rate.',
      },
      {
        key: 'fixedVsFloating',
        title: 'Fixed vs Floating Rates',
        body: 'Floating rates can move with the benchmark; fixed rates stay constant for a defined period or loan life (terms vary). Hybrid structures also exist. Match the structure to your risk tolerance and holding period.',
      },
      {
        key: 'eligibility',
        title: 'Eligibility',
        body: 'Lenders assess income, obligations, credit score, age at loan maturity, employment stability and property-related checks. Co-applicants can strengthen applications in some cases.',
      },
      {
        key: 'ltv',
        title: 'Loan-to-Value Ratio',
        body: 'LTV is the loan amount relative to property value. Higher LTV means a smaller down payment but can affect pricing and eligibility. Regulatory and lender caps apply by property type and ticket size.',
      },
      {
        key: 'downPayment',
        title: 'Down Payment',
        body: 'Down payment covers the portion not financed by the lender. Plan for registration, stamp duty and other closing costs in addition to the down payment.',
      },
      {
        key: 'emiCalculation',
        title: 'Home Loan EMI',
        body: 'Long tenures lower EMI but raise total interest. Model EMI and total cost before deciding tenure. Use the Home Loan EMI Calculator for illustrative scenarios only.',
      },
      {
        key: 'tenure',
        title: 'Tenure',
        body: 'Home loan tenures can run for decades subject to age and lender policy. Shorter tenures cost more monthly but less interest overall if you can afford the EMI.',
      },
      {
        key: 'creditScore',
        title: 'Credit Score',
        body: 'Credit history influences approval and pricing. Resolve errors on your report and keep utilisation manageable before applying.',
      },
      {
        key: 'documents',
        title: 'Documents',
        body: 'Expect KYC, income proofs, bank statements, property documents, sale agreement and valuation-related papers. Requirements differ for salaried, self-employed and under-construction cases.',
      },
      {
        key: 'fees',
        title: 'Processing Fees',
        body: 'Processing fees, legal/technical charges and other costs can be significant. Confirm what is refundable if the loan does not proceed.',
      },
      {
        key: 'prepayment',
        title: 'Prepayment',
        body: 'Floating-rate home loans often allow prepayment with fewer restrictions than fixed-rate products, but always verify current policy and any applicable charges.',
      },
      {
        key: 'balanceTransfer',
        title: 'Balance Transfer',
        body: 'Balance transfer moves an existing home loan to another lender, usually for a lower rate or better features. Factor processing fees, legal costs and remaining tenure before switching.',
      },
      {
        key: 'joint',
        title: 'Joint Home Loans',
        body: 'Joint applications can combine incomes for higher eligibility and may offer tax-related considerations depending on ownership and repayment. Legal ownership structure should be planned carefully.',
      },
    ],
    defaultFaqs: [
      {
        question: 'Is a lower home loan rate always better?',
        answer:
          'Not always. Compare fees, reset terms, prepayment rules and total cost over your expected holding period.',
      },
      {
        question: 'What is LTV in a home loan?',
        answer:
          'Loan-to-value is the sanctioned loan as a share of property value. Higher LTV reduces down payment needs but may tighten eligibility or pricing.',
      },
    ],
  },
  'car-loan': {
    h1: 'Compare Car Loans',
    breadcrumbLabel: 'Car Loans',
    intro:
      'Compare new and used car loan rates, down payment expectations, tenure, processing fees and eligibility.',
    metaTitle: 'Compare Car Loans | New & Used Vehicle Financing',
    metaDescription:
      'Compare car loan interest rates, EMI, tenure, down payment and processing fees for new and used vehicles.',
    relatedCalculators: [
      calc('car-loan', 'Car Loan EMI Calculator'),
      calc('loan-eligibility', 'Loan Eligibility Calculator'),
      calc('loan-prepayment', 'Loan Prepayment Calculator'),
    ],
    sections: [
      {
        key: 'whatIs',
        title: 'New and Used Car Loans',
        body: 'Car loans finance purchase of new or used vehicles. Used-car financing may have different LTV caps, tenure limits and documentation. Confirm whether the listing covers new, used or both.',
      },
      {
        key: 'interestRates',
        title: 'Car Loan Interest Rates',
        body: 'Rates vary by lender, vehicle type, tenure and borrower profile. Manufacturer or dealer schemes may differ from bank/NBFC book rates — verify which product you are comparing.',
      },
      {
        key: 'downPayment',
        title: 'Down Payment & Financing Percentage',
        body: 'Lenders fund a portion of the on-road or ex-showroom price depending on policy. Your down payment covers the rest plus incidental costs. Higher down payment can improve approval odds.',
      },
      {
        key: 'emiCalculation',
        title: 'Car Loan EMI',
        body: 'EMI depends on financed amount, rate and tenure. Keep EMI comfortable relative to income and other debts. Use the Car Loan EMI Calculator for illustrations only.',
      },
      {
        key: 'tenure',
        title: 'Tenure',
        body: 'Car loan tenures are typically shorter than home loans. Longer tenure lowers EMI but increases total interest and may extend beyond preferred ownership period.',
      },
      {
        key: 'eligibility',
        title: 'Eligibility',
        body: 'Income, age, credit score and existing obligations are common checks. For used cars, vehicle age and valuation also matter.',
      },
      {
        key: 'documents',
        title: 'Documents',
        body: 'KYC, income proofs, bank statements and vehicle quotation or sale documents are commonly required. Used cars may need additional inspection papers.',
      },
      {
        key: 'fees',
        title: 'Processing Fees',
        body: 'Review processing fees, documentation charges and any foreclosure costs. Confirm whether fees are deducted from disbursal.',
      },
      {
        key: 'prepayment',
        title: 'Foreclosure / Prepayment',
        body: 'Prepayment or foreclosure rules differ by lender. Check lock-in periods and charges before planning early closure.',
      },
      {
        key: 'alternatives',
        title: 'Car Loan vs Personal Loan',
        body: 'Car loans are vehicle-backed financing with hypothecation. Personal loans are usually unsecured and may be costlier or more flexible depending on profile and use case.',
      },
      {
        key: 'hypothecation',
        title: 'Hypothecation',
        body: 'The vehicle is typically hypothecated to the lender until the loan is closed. Sale or transfer usually requires a NOC after clearance.',
      },
    ],
    defaultFaqs: [
      {
        question: 'Can I get a loan for a used car?',
        answer:
          'Many lenders offer used-car financing with limits on vehicle age, tenure and LTV. Compare products marked for used vehicles and confirm valuation rules.',
      },
    ],
  },
  'education-loan': {
    h1: 'Compare Education Loans',
    breadcrumbLabel: 'Education Loans',
    intro:
      'Plan education financing for domestic study and study abroad — education cost, funding gap, study-period interest, moratorium, government support and co-applicant considerations.',
    metaTitle: 'Education Loan Planner | Cost, Moratorium & Government Support',
    metaDescription:
      'Plan education loan funding for India and abroad: estimate education cost and funding gap, compare study-period interest options, understand moratorium and EMI after study, and explore PM-Vidyalaxmi and PM-USP CSIS with official sources.',
    relatedCalculators: [
      calc('education-loan-emi', 'Education Loan EMI Calculator'),
      calc('loan-eligibility', 'Loan Eligibility Calculator'),
    ],
    sections: [
      {
        key: 'whatIs',
        title: 'Domestic Education & Study Abroad',
        body: 'Education loans can fund tuition and related expenses for courses in India or abroad. Product features, collateral needs and currency considerations often differ for overseas study.',
      },
      {
        key: 'securedVsUnsecured',
        title: 'Secured vs Unsecured',
        body: 'Some education loans are unsecured up to a threshold; larger amounts may require collateral or a co-applicant. Terms depend on course, institution and lender policy.',
      },
      {
        key: 'moratorium',
        title: 'Moratorium',
        body: 'A moratorium may defer full EMI until after course completion or a grace period. Interest may still accrue during this time — confirm simple vs compound treatment with the lender.',
      },
      {
        key: 'collateral',
        title: 'Collateral',
        body: 'Collateral can include property or other accepted security for higher ticket loans. Valuation and legal checks apply. Unsecured limits vary widely.',
      },
      {
        key: 'coApplicant',
        title: 'Co-applicant',
        body: 'Parents or guardians often join as co-applicants. Their income and credit profile can influence eligibility and pricing.',
      },
      {
        key: 'coveredExpenses',
        title: 'Covered Expenses',
        body: 'Eligible costs may include tuition, hostel, exam fees, travel and equipment depending on the product. Always match the sanction to the institute fee structure.',
      },
      {
        key: 'eligibility',
        title: 'Eligibility',
        body: 'Admission offer, course recognition, academic profile, co-applicant income and credit history are common factors.',
      },
      {
        key: 'documents',
        title: 'Documents',
        body: 'Admission letter, fee structure, KYC, income proofs and collateral papers (if any) are typically required.',
      },
      {
        key: 'repayment',
        title: 'Repayment',
        body: 'Repayment usually begins after the moratorium as per sanction terms. Plan EMI against expected post-study income carefully.',
      },
    ],
    defaultFaqs: [
      {
        question: 'Does interest accrue during the course period?',
        answer:
          'Often yes, depending on the product. Confirm whether interest is simple or compounding and whether partial payments are allowed during study.',
      },
    ],
  },
  'business-loan': {
    h1: 'Plan and Compare Business Loans',
    breadcrumbLabel: 'Business Loans',
    intro:
      'Estimate your business funding requirement, understand repayment capacity and compare financing options based on your business needs.',
    metaTitle: 'Business Loan Calculator, Eligibility & Comparison | Varnarc',
    metaDescription:
      'Plan business borrowing with EMI, cash-flow impact, DSCR, working capital vs term loan guidance, MSME support exploration and Business Loan comparison.',
    relatedCalculators: [
      calc('business-loan-emi', 'Business Loan EMI Calculator'),
      calc('loan-eligibility', 'Loan Eligibility Calculator'),
    ],
    sections: [
      {
        key: 'workingCapital',
        title: 'Working Capital',
        body: 'Working capital facilities help manage day-to-day cash flow — inventory, receivables and operating expenses. Structures may include term loans, lines of credit or other products depending on the lender.',
      },
      {
        key: 'termLoans',
        title: 'Term Loans',
        body: 'Term loans fund longer-horizon needs such as equipment or expansion, repaid over a fixed schedule. Match tenure to asset life and cash generation.',
      },
      {
        key: 'securedVsUnsecured',
        title: 'Secured / Unsecured',
        body: 'Unsecured business credit relies on cash flows and credit strength. Secured facilities use collateral and may support larger amounts — with asset risk if obligations are missed.',
      },
      {
        key: 'eligibility',
        title: 'Eligibility',
        body: 'Business vintage, turnover, profitability, bureau records, banking conduct and industry risk are common assessment inputs.',
      },
      {
        key: 'turnover',
        title: 'Turnover',
        body: 'Many products set minimum turnover thresholds. Provide consistent financials and GST/banking evidence where requested.',
      },
      {
        key: 'vintage',
        title: 'Business Vintage',
        body: 'Newer businesses may face tighter eligibility or require stronger co-applicant/collateral support.',
      },
      {
        key: 'cashFlow',
        title: 'Cash Flow',
        body: 'Lenders focus on repayment capacity from operating cash flow. Seasonal businesses should plan EMI around cash cycles.',
      },
      {
        key: 'documents',
        title: 'Documents',
        body: 'KYC, business registrations, financial statements, bank statements, GST returns and projections are commonly requested.',
      },
      {
        key: 'loanAmount',
        title: 'Loan Amount',
        body: 'Sanction size depends on assessed need and repayment capacity. Listed maximums are product ceilings, not personal offers.',
      },
      {
        key: 'emiCalculation',
        title: 'EMI',
        body: 'Model EMI against realistic cash flow. Use calculators only for illustration before discussing sanction terms with a lender.',
      },
    ],
    defaultFaqs: [
      {
        question: 'Is a business loan the same as a personal loan used for business?',
        answer:
          'No. Business loans are underwritten on business cash flows and documents. Using personal loans for business may have different cost, limits and policy implications.',
      },
    ],
  },
  'gold-loan': {
    h1: 'Plan & Compare Gold Loans',
    breadcrumbLabel: 'Gold Loans',
    intro:
      'Estimate borrowing capacity using gold weight, purity and indicative valuation, then explore repayment costs, eligibility and available lender offers.',
    metaTitle: 'Gold Loan Calculator, Eligibility & Comparison',
    metaDescription:
      'Estimate Gold Loan value using weight, purity and indicative LTV, calculate repayment costs, understand eligibility, risks and compare available Gold Loan offers.',
    relatedCalculators: [
      calc('gold-loan-emi', 'Gold Loan EMI Calculator'),
      calc('loan-eligibility', 'Loan Eligibility Calculator'),
    ],
    sections: [
      {
        key: 'valuation',
        title: 'Gold Valuation',
        body: 'Lenders assess purity and weight to arrive at a lendable value. Valuation methods and accepted ornaments differ by institution.',
      },
      {
        key: 'ltv',
        title: 'LTV',
        body: 'Loan-to-value for gold loans depends on applicable requirements and lender policy. Higher LTV increases borrowing against the same gold but can raise risk if collateral value moves. Confirm current rules with official sources and the lender.',
      },
      {
        key: 'eligibleGold',
        title: 'Eligible Gold',
        body: 'Typically hallmarked jewellery meeting purity criteria is accepted. Coins, bars or certain items may be restricted — confirm with the lender.',
      },
      {
        key: 'tenure',
        title: 'Tenure',
        body: 'Gold loan tenures are often shorter than home loans. Choose a repayment plan you can meet without relying on forced renewal.',
      },
      {
        key: 'repayment',
        title: 'Repayment Options',
        body: 'Products may offer bullet interest, EMI or other structures. Understand when principal is due and what happens at maturity.',
      },
      {
        key: 'auctionRisk',
        title: 'Auction / Default Risk',
        body: 'If dues are not paid as agreed, pledged gold may be auctioned after due process. Read default and notice terms carefully.',
      },
      {
        key: 'eligibility',
        title: 'Eligibility',
        body: 'Ownership of eligible gold and basic KYC are central. Income documentation requirements are often lighter than unsecured loans but still apply in many cases.',
      },
      {
        key: 'documents',
        title: 'Documents',
        body: 'KYC documents and gold ownership declarations are commonly required. Keep copies of pledge receipts safe.',
      },
      {
        key: 'alternatives',
        title: 'Gold Loan vs Personal Loan',
        body: 'Gold loans are secured and may disburse faster against jewellery. Personal loans are unsecured and do not require pledging assets, but pricing and limits follow different risk models.',
      },
    ],
    defaultFaqs: [
      {
        question: 'Will I get my exact jewellery back?',
        answer:
          'You should receive the pledged items on full closure, subject to lender process. Verify seal/packet details at pledge and release.',
      },
    ],
  },
  'two-wheeler-loan': {
    h1: 'Compare Two-Wheeler Loans',
    breadcrumbLabel: 'Two-Wheeler Loans',
    intro:
      'Compare two-wheeler loan rates, tenure, down payment expectations, processing fees and eligibility for scooters and motorcycles.',
    metaTitle: 'Two-Wheeler Loan Calculator, EMI & Eligibility',
    metaDescription:
      'Compare two-wheeler loan interest rates, EMI, tenure and eligibility for scooters and motorcycles.',
    relatedCalculators: [
      calc('bike-loan-emi', 'Two-Wheeler Loan EMI Calculator'),
      calc('loan-eligibility', 'Loan Eligibility Calculator'),
    ],
    sections: [
      {
        key: 'whatIs',
        title: 'What is a Two-Wheeler Loan?',
        body: 'Two-wheeler loans finance scooters and motorcycles, often with hypothecation until closure. Dealer and bank/NBFC schemes may differ — compare the actual product terms.',
      },
      {
        key: 'interestRates',
        title: 'Interest Rates',
        body: 'Rates depend on lender, tenure and borrower profile. Verify whether a displayed rate is a scheme rate or standard book rate.',
      },
      {
        key: 'downPayment',
        title: 'Down Payment',
        body: 'A portion of the on-road price is usually paid upfront. Confirm what is financed versus payable at the dealership.',
      },
      {
        key: 'emiCalculation',
        title: 'EMI',
        body: 'Use an EMI calculator to compare tenure options. Keep repayments affordable relative to income.',
      },
      {
        key: 'tenure',
        title: 'Tenure',
        body: 'Tenures are typically shorter than car or home loans. Longer tenure reduces EMI but increases total interest.',
      },
      {
        key: 'eligibility',
        title: 'Eligibility',
        body: 'Age, income, credit history and KYC completeness are common factors. First-time borrowers may see different documentation asks.',
      },
      {
        key: 'documents',
        title: 'Documents',
        body: 'KYC, income proof and quotation or invoice details are commonly required.',
      },
      {
        key: 'fees',
        title: 'Fees',
        body: 'Check processing fees and foreclosure terms. Ask whether charges are deducted from disbursal.',
      },
    ],
    defaultFaqs: [
      {
        question: 'Is dealer financing the same as a bank two-wheeler loan?',
        answer:
          'Not always. Dealer schemes may be arranged through partner financiers with different rates and fees. Compare the sanction terms carefully.',
      },
    ],
  },
  'loan-against-property': {
    h1: 'Plan and Compare Loans Against Property',
    breadcrumbLabel: 'Loan Against Property',
    intro:
      'Estimate how much you may be able to borrow against an owned property, understand LTV and repayment capacity, then compare available LAP options.',
    metaTitle: 'Loan Against Property Calculator, LTV & Eligibility',
    metaDescription:
      'Plan a loan against property with illustrative LTV and EMI tools, estimate borrowing capacity from property value, review eligibility and valuation considerations, then compare verified LAP products.',
    relatedCalculators: [
      calc('loan-against-property-emi', 'LAP EMI Calculator'),
      calc('loan-eligibility', 'Loan Eligibility Calculator'),
      calc('loan-prepayment', 'Loan Prepayment Calculator'),
    ],
    sections: [
      {
        key: 'whatIs',
        title: 'What is Loan Against Property?',
        body: 'LAP provides credit against residential or commercial property while you typically retain usage rights, subject to mortgage terms. It is secured credit — default risk includes enforcement against the property.',
      },
      {
        key: 'interestRates',
        title: 'Interest Rates',
        body: 'LAP rates are often lower than unsecured personal loans for similar profiles because of collateral, but still vary by property type, LTV and borrower strength.',
      },
      {
        key: 'ltv',
        title: 'LTV',
        body: 'Sanctioned amount is linked to property valuation and allowable LTV. Legal and technical diligence can affect final eligibility.',
      },
      {
        key: 'eligibility',
        title: 'Eligibility',
        body: 'Income, credit profile, property title clarity and existing encumbrances are central. Self-employed and salaried criteria differ by lender.',
      },
      {
        key: 'documents',
        title: 'Documents',
        body: 'KYC, income proofs, property title documents, tax receipts and banking records are commonly required.',
      },
      {
        key: 'emiCalculation',
        title: 'EMI',
        body: 'Model EMI across tenure options. Longer tenures lower EMI but increase total interest — align with cash flow and purpose of funds.',
      },
      {
        key: 'fees',
        title: 'Fees',
        body: 'Processing, legal and valuation charges can be material. Confirm the full cost stack before accepting a sanction.',
      },
      {
        key: 'prepayment',
        title: 'Prepayment',
        body: 'Prepayment rules depend on rate type and lender policy. Verify charges and process before planning early closure.',
      },
    ],
    defaultFaqs: [
      {
        question: 'Can I continue living in a mortgaged home under LAP?',
        answer:
          'Often yes for residential LAP, subject to lender terms. The property remains security until the loan is closed.',
      },
    ],
  },
};

export type CategoryContentSections = Record<string, string | string[] | null | undefined> & {
  relatedCalculatorSlugs?: string[];
  relatedGuideSlugs?: string[];
};

export function getLoanCategoryPageDefaults(slug: LoanCategorySlug): LoanCategoryPageCopy {
  return LOAN_CATEGORY_PAGE_DEFAULTS[slug];
}

/** Merge CMS contentSections over defaults. Empty/null CMS values keep defaults. */
export function resolveCategoryEducationSections(
  slug: LoanCategorySlug,
  cmsSections?: CategoryContentSections | null,
): LoanCategorySection[] {
  const defaults = LOAN_CATEGORY_PAGE_DEFAULTS[slug].sections;
  if (!cmsSections || typeof cmsSections !== 'object') return defaults;

  return defaults.map((section) => {
    const override = cmsSections[section.key];
    if (typeof override === 'string' && override.trim()) {
      return { ...section, body: override.trim() };
    }
    return section;
  });
}

export function resolveCategoryRelatedCalculators(
  slug: LoanCategorySlug,
  cmsSections?: CategoryContentSections | null,
): ContextualLink[] {
  const defaults = LOAN_CATEGORY_PAGE_DEFAULTS[slug].relatedCalculators;
  const slugs = cmsSections?.relatedCalculatorSlugs;
  if (!Array.isArray(slugs) || !slugs.length) return defaults;

  const links: ContextualLink[] = [];
  for (const raw of slugs) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const calcSlug = raw.trim();
    if (!isKnownCalculatorSlug(calcSlug)) continue;
    const href = calculatorHref(calcSlug);
    const label =
      defaults.find((d) => d.href.includes(`/calculators/${calcSlug}`))?.label ??
      `${calcSlug.replace(/-/g, ' ')} calculator`;
    links.push({ label, href });
  }
  return links.length ? links : defaults;
}

export function resolveCategoryH1(slug: LoanCategorySlug, _categoryName?: string | null): string {
  return LOAN_CATEGORY_PAGE_DEFAULTS[slug].h1;
}

export function resolveCategoryBreadcrumbLabel(
  slug: LoanCategorySlug,
  categoryName?: string | null,
): string {
  return LOAN_CATEGORY_PAGE_DEFAULTS[slug].breadcrumbLabel || categoryName?.trim() || slug;
}

export function resolveCategoryIntro(
  slug: LoanCategorySlug,
  category?: {
    introduction?: string | null;
    shortDescription?: string | null;
    description?: string | null;
  } | null,
): string {
  const fromCms =
    category?.introduction?.trim() ||
    category?.shortDescription?.trim() ||
    category?.description?.trim();
  return fromCms || LOAN_CATEGORY_PAGE_DEFAULTS[slug].intro;
}

export function resolveCategorySeo(
  slug: LoanCategorySlug,
  category?: {
    metaTitle?: string | null;
    metaDescription?: string | null;
    name?: string | null;
    introduction?: string | null;
  } | null,
): { title: string; description: string } {
  const defaults = LOAN_CATEGORY_PAGE_DEFAULTS[slug];
  return {
    title: category?.metaTitle?.trim() || defaults.metaTitle,
    description:
      category?.metaDescription?.trim() ||
      category?.introduction?.trim() ||
      defaults.metaDescription,
  };
}

/** Section keys available for admin editors (union across categories + shared). */
export const LOAN_CATEGORY_SECTION_KEYS = [
  'whatIs',
  'howItWorks',
  'interestRates',
  'rateFactors',
  'fixedVsFloating',
  'eligibility',
  'ltv',
  'downPayment',
  'emiCalculation',
  'tenure',
  'creditScore',
  'documents',
  'fees',
  'prepayment',
  'balanceTransfer',
  'joint',
  'securedVsUnsecured',
  'alternatives',
  'vsLap',
  'advantages',
  'mistakes',
  'howToApply',
  'hypothecation',
  'moratorium',
  'collateral',
  'coApplicant',
  'coveredExpenses',
  'repayment',
  'workingCapital',
  'termLoans',
  'turnover',
  'vintage',
  'cashFlow',
  'loanAmount',
  'valuation',
  'eligibleGold',
  'auctionRisk',
] as const;
