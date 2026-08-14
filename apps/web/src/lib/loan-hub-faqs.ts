import type { HubFaqItem } from '@/components/hub/hub-faq-section';
import type { FinanceFaq } from '@/services/finance';

const LOAN_HUB_ENTITY = 'loan_hub';

/** Topics that belong on the loans hub FAQ rail. */
const LOAN_TOPIC =
  /\b(loan|emi|interest|tenure|prepay|foreclos|eligib|credit\s*score|processing\s*fee|disburs|collateral|secured|unsecured|fixed|floating|repay|document)\b/i;

/** Explicitly keep SIP / investing / credit-card FAQs off this page. */
const EXCLUDE_TOPIC =
  /\b(sip|lump\s*sum|mutual\s*fund|stock|share\s*market|equity|portfolio|fixed\s*deposit|\bfd\b|ppf|nps|crypto|credit\s*card\s*reward|reward\s*point|investing|investment)\b/i;

function faqHaystack(faq: FinanceFaq): string {
  const categoryName =
    typeof faq.category === 'string'
      ? faq.category
      : faq.category && typeof faq.category === 'object'
        ? (faq.category as { name?: string | null; slug?: string | null }).name ||
          (faq.category as { slug?: string | null }).slug ||
          ''
        : '';
  return `${faq.question} ${faq.answer} ${faq.entityType ?? ''} ${categoryName}`;
}

export function isLoanHubFaq(faq: FinanceFaq): boolean {
  if (faq.entityType === LOAN_HUB_ENTITY) return true;
  const text = faqHaystack(faq);
  if (EXCLUDE_TOPIC.test(text)) return false;
  return LOAN_TOPIC.test(text);
}

/**
 * Prefer CMS FAQs tagged for the loan hub (or loan-topic FAQs).
 * No hardcoded template questions — empty if admin has not published any.
 */
export function pickLoanFaqs(apiFaqs: FinanceFaq[], limit = 8): HubFaqItem[] {
  const preferred = apiFaqs.filter((f) => f.entityType === LOAN_HUB_ENTITY);
  const source = preferred.length ? preferred : apiFaqs.filter(isLoanHubFaq);

  return source
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, limit)
    .map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
    }));
}
