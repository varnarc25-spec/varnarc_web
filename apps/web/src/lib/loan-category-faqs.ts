import type { HubFaqItem } from '@/components/hub/hub-faq-section';
import type { FinanceFaq } from '@/services/finance';
import { getLoanCategoryPageDefaults, type LoanCategorySlug } from '@/lib/loan-category-page';

const CATEGORY_ENTITY = 'loan_category';

function categorySlugFromFaq(faq: FinanceFaq): string | null {
  if (faq.category && typeof faq.category === 'object' && faq.category.slug) {
    return faq.category.slug;
  }
  return null;
}

/**
 * Prefer CMS FAQs tagged for this loan category.
 * Fall back to category default FAQs (educational, non-rate claims).
 */
export function pickLoanCategoryFaqs(
  apiFaqs: FinanceFaq[],
  slug: LoanCategorySlug,
  categoryId?: string | null,
  limit = 8,
): HubFaqItem[] {
  const matched = apiFaqs
    .filter((f) => {
      if (f.entityType === CATEGORY_ENTITY) {
        if (categoryId && f.entityId === categoryId) return true;
        const faqSlug = categorySlugFromFaq(f);
        if (faqSlug === slug) return true;
      }
      return categorySlugFromFaq(f) === slug;
    })
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, limit)
    .map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
    }));

  if (matched.length) return matched;

  return getLoanCategoryPageDefaults(slug)
    .defaultFaqs.slice(0, limit)
    .map((f, index) => ({
      id: `default-${slug}-${index}`,
      question: f.question,
      answer: f.answer,
    }));
}
