import type { ArticleListItem } from '@/services/content';
import type { FinanceGuide } from '@/services/finance';
import { resolveArticleImageUrl } from '@/lib/article-category-icons';
import { articlePath, financeGuidesPath } from '@/lib/finance-routes';
import { inferRelatedLoanCategorySlug } from '@/lib/loan-contextual-links';
import { resolveLoanGuideCoverImage } from '@/lib/loan-visual-assets';

/** Topics allowed on the loans hub guides rail. */
const LOAN_TOPIC_PATTERNS = [
  /\bloans?\b/i,
  /\bpersonal\s+loans?\b/i,
  /\bhome\s+loans?\b/i,
  /\bhousing\s+loans?\b/i,
  /\bcar\s+loans?\b/i,
  /\bauto\s+loans?\b/i,
  /\bvehicle\s+loans?\b/i,
  /\beducation\s+loans?\b/i,
  /\bstudent\s+loans?\b/i,
  /\bbusiness\s+loans?\b/i,
  /\bgold\s+loans?\b/i,
  /\bloan\s+against\s+property\b/i,
  /\bemi\b/i,
  /\bloan\s+eligibility\b/i,
  /\bcredit\s+scores?\b/i,
  /\btwo[-\s]?wheeler\s+loans?\b/i,
] as const;

/** Exclude unless the title clearly stays loan-relevant. */
const EXCLUDE_PATTERNS = [
  /\bsip\b/i,
  /\bmutual\s+funds?\b/i,
  /\binvestments?\b/i,
  /\binvesting\b/i,
  /\bstocks?\b/i,
  /\bshares?\b/i,
  /\bequity\b/i,
  /\bportfolio\b/i,
  /\bfixed\s+deposit\b/i,
  /\bfd\b/i,
  /\bppf\b/i,
  /\bnps\b/i,
  /\bcrypto\b/i,
  /\bcredit\s+cards?\b/i,
  /\binsurance\b/i,
  /\btax\s+saving\b/i,
] as const;

export type LoanGuideCardModel = {
  id: string;
  title: string;
  href: string;
  excerpt: string | null;
  categoryLabel: string;
  imageUrl: string;
  updatedAt: string | null;
  readingTimeMinutes: number | null;
  relatedCategorySlug?: string | null;
};

function haystack(...parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(' · ');
}

function matchesLoanTopic(text: string): boolean {
  return LOAN_TOPIC_PATTERNS.some((re) => re.test(text));
}

function isExcludedTopic(text: string): boolean {
  if (!EXCLUDE_PATTERNS.some((re) => re.test(text))) return false;
  // Allow if the piece is still clearly about loans (e.g. "loan vs credit card")
  return !/\bloan/i.test(text);
}

export function isLoanRelatedGuideText(text: string): boolean {
  if (!text.trim()) return false;
  if (isExcludedTopic(text)) return false;
  return matchesLoanTopic(text);
}

function estimateReadingMinutes(content?: string | null, summary?: string | null): number | null {
  const source = content?.trim() || summary?.trim();
  if (!source) return null;
  const words = source.split(/\s+/).filter(Boolean).length;
  if (words < 40) return null;
  return Math.max(1, Math.ceil(words / 200));
}

/** Prefer shared Varnarc category/hub art over mixed CMS photography. */
function resolveLoanGuideImageUrl(input: {
  featuredUrl?: string | null;
  slug: string;
  title?: string | null;
  excerpt?: string | null;
  categoryLabel?: string | null;
}): string {
  return resolveLoanGuideCoverImage(input);
}

function categoryNameFromGuide(guide: FinanceGuide): string {
  if (typeof guide.category === 'string' && guide.category.trim()) return guide.category;
  if (guide.category && typeof guide.category === 'object' && 'name' in guide.category) {
    const name = (guide.category as { name?: string | null }).name;
    if (name?.trim()) return name;
  }
  return 'Loans';
}

export function articleToLoanGuideCard(article: ArticleListItem): LoanGuideCardModel | null {
  const text = haystack(
    article.title,
    article.excerpt,
    article.category?.name,
    article.category?.slug,
    article.slug,
  );
  if (!isLoanRelatedGuideText(text)) return null;

  return {
    id: article.id,
    title: article.title,
    href: articlePath(article.slug),
    excerpt: article.excerpt,
    categoryLabel: article.category?.name?.trim() || 'Loans',
    imageUrl: resolveLoanGuideImageUrl({
      featuredUrl: resolveArticleImageUrl(article),
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      categoryLabel: article.category?.name,
    }),
    updatedAt: article.publishedAt,
    readingTimeMinutes: article.readingTimeMinutes ?? null,
    relatedCategorySlug: inferRelatedLoanCategorySlug(
      article.title,
      article.excerpt,
      article.category?.name,
      article.slug,
    ),
  };
}

export function financeGuideToLoanGuideCard(guide: FinanceGuide): LoanGuideCardModel | null {
  const categoryLabel = categoryNameFromGuide(guide);
  const text = haystack(guide.title, guide.summary, guide.content, categoryLabel, guide.slug);
  if (!isLoanRelatedGuideText(text)) return null;

  return {
    id: guide.id,
    title: guide.title,
    href: financeGuidesPath(guide.slug),
    excerpt: guide.summary ?? null,
    categoryLabel,
    imageUrl: resolveLoanGuideImageUrl({
      slug: guide.slug,
      title: guide.title,
      excerpt: guide.summary,
      categoryLabel,
    }),
    updatedAt: guide.updatedAt ?? guide.publishedAt ?? null,
    readingTimeMinutes: estimateReadingMinutes(guide.content, guide.summary),
    relatedCategorySlug: inferRelatedLoanCategorySlug(
      guide.title,
      guide.summary,
      categoryLabel,
      guide.slug,
    ),
  };
}

/** Prefer CMS articles; fill remaining slots from finance guides. */
export function buildLoanGuideCards(
  articles: ArticleListItem[],
  guides: FinanceGuide[],
  limit = 6,
): LoanGuideCardModel[] {
  const fromArticles = articles
    .map(articleToLoanGuideCard)
    .filter((c): c is LoanGuideCardModel => c != null);

  const seen = new Set(fromArticles.map((c) => c.title.toLowerCase()));
  const fromGuides = guides
    .map(financeGuideToLoanGuideCard)
    .filter((c): c is LoanGuideCardModel => c != null)
    .filter((c) => !seen.has(c.title.toLowerCase()));

  return [...fromArticles, ...fromGuides].slice(0, limit);
}

const PERSONAL_CATEGORY_GUIDE_PATTERNS = [
  /\bpersonal\s+loans?\b/i,
  /\bemi\b/i,
  /\bloan\s+eligibility\b/i,
  /\bcredit\s+scores?\b/i,
  /\brepayment\b/i,
  /\bprepayment\b/i,
] as const;

function matchesPersonalLoanCategoryGuide(text: string): boolean {
  if (!isLoanRelatedGuideText(text)) return false;
  return PERSONAL_CATEGORY_GUIDE_PATTERNS.some((re) => re.test(text));
}

function cardBySlug(
  slug: string,
  articles: ArticleListItem[],
  guides: FinanceGuide[],
): LoanGuideCardModel | null {
  const article = articles.find((a) => a.slug === slug);
  if (article) {
    return {
      id: article.id,
      title: article.title,
      href: articlePath(article.slug),
      excerpt: article.excerpt,
      categoryLabel: article.category?.name?.trim() || 'Loans',
      imageUrl: resolveLoanGuideImageUrl({
        featuredUrl: resolveArticleImageUrl(article),
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        categoryLabel: article.category?.name,
      }),
      updatedAt: article.publishedAt,
      readingTimeMinutes: article.readingTimeMinutes ?? null,
      relatedCategorySlug: inferRelatedLoanCategorySlug(
        article.title,
        article.excerpt,
        article.category?.name,
        article.slug,
      ),
    };
  }

  const guide = guides.find((g) => g.slug === slug);
  if (!guide) return null;
  return financeGuideToLoanGuideCard(guide);
}

/**
 * Category landing guides: honour CMS relatedGuideSlugs first, then topic-filtered content.
 * Personal loan pages stay scoped to PL / EMI / eligibility / credit / repayment topics.
 */
export function buildLoanCategoryGuideCards(input: {
  categorySlug: string;
  relatedGuideSlugs?: string[] | null;
  articles: ArticleListItem[];
  guides: FinanceGuide[];
  limit?: number;
}): LoanGuideCardModel[] {
  const limit = input.limit ?? 6;
  const cards: LoanGuideCardModel[] = [];
  const seen = new Set<string>();

  for (const raw of input.relatedGuideSlugs ?? []) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const card = cardBySlug(raw.trim(), input.articles, input.guides);
    if (!card || seen.has(card.id)) continue;
    seen.add(card.id);
    cards.push(card);
    if (cards.length >= limit) return cards;
  }

  const inferredArticles =
    input.categorySlug === 'personal-loan'
      ? input.articles.filter((a) =>
          matchesPersonalLoanCategoryGuide(
            haystack(a.title, a.excerpt, a.category?.name, a.category?.slug, a.slug),
          ),
        )
      : input.articles;
  const inferredGuides =
    input.categorySlug === 'personal-loan'
      ? input.guides.filter((g) =>
          matchesPersonalLoanCategoryGuide(
            haystack(g.title, g.summary, g.content, categoryNameFromGuide(g), g.slug),
          ),
        )
      : input.guides;

  for (const card of buildLoanGuideCards(inferredArticles, inferredGuides, limit)) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    cards.push(card);
    if (cards.length >= limit) break;
  }

  return cards;
}
