import type { Metadata } from 'next';
import Link from 'next/link';
import { AdBanner } from '@/components/business/ad-banner';
import { ReviewsFeed } from '@/components/reviews/reviews-feed';
import { ReviewsSearch } from '@/components/reviews/reviews-search';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/json-ld';
import { formatDate } from '@/lib/format';
import {
  REVIEW_CATEGORY_META,
  classifyReview,
  exploreTopics,
  parseEditorialScore,
  reviewDate,
  reviewerLabel,
  type ReviewCategoryKey,
} from '@/lib/reviews-hub';
import { fetchReviews, type ReviewListItem } from '@/services/content';

export const metadata: Metadata = {
  title: 'Product & Service Reviews | Varnarc',
  description:
    'Explore Varnarc product and service reviews with clear evaluation criteria, transparent editorial ratings and practical research.',
  alternates: { canonical: '/reviews' },
};

export const revalidate = 60;

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';

export default async function ReviewsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? '';
  const initialCategory = (Object.keys(REVIEW_CATEGORY_META) as ReviewCategoryKey[]).includes(
    params.category as ReviewCategoryKey,
  )
    ? (params.category as ReviewCategoryKey)
    : undefined;

  const { data } = await fetchReviews(48, { search: query || undefined });
  const reviews = data ?? [];
  const [featured, ...rest] = reviews;
  const secondary = rest.slice(0, 2);
  const picks = rest.slice(2, 5);
  const topicGroups = exploreTopics(reviews);
  const navCategories = topicGroups.map((group) => group.key);

  return (
    <main className="bg-[#f7f4ee] text-slate-950">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${SITE}/` },
          { name: 'Reviews', url: `${SITE}/reviews` },
        ])}
      />

      <header className="border-b border-stone-200/80">
        <div className="site-container pb-10 pt-6">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-[13px] text-stone-500"
          >
            <Link href="/" className="hover:text-slate-900">
              Home
            </Link>
            <span aria-hidden>›</span>
            <span className="font-medium text-stone-700">Reviews</span>
          </nav>

          <p className="mt-8 text-[12px] font-bold uppercase tracking-[0.22em] text-amber-800">
            Reviews
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl sm:leading-[1.1]">
            Product reviews with clear reasoning.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Independent reviews of products and services based on practical criteria, transparent
            scoring and clearly explained conclusions.
          </p>

          <div className="mt-7 max-w-2xl">
            <ReviewsSearch initialQuery={query} reviews={reviews} />
          </div>

          {navCategories.length ? (
            <nav
              className="mt-5 flex flex-wrap gap-x-3 gap-y-2 text-sm font-semibold text-slate-700"
              aria-label="Review topics"
            >
              {navCategories.map((key, index) => (
                <span key={key}>
                  <Link href={`/reviews?category=${key}`} className="hover:text-blue-800">
                    {REVIEW_CATEGORY_META[key].label}
                  </Link>
                  {index < navCategories.length - 1 ? (
                    <span className="ml-3 text-stone-300">·</span>
                  ) : null}
                </span>
              ))}
            </nav>
          ) : null}

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-stone-200/80 pt-5 text-[13px] font-medium text-stone-600">
            {['Clear criteria', 'Editorial ratings', 'Reviewed dates', 'Source transparency'].map(
              (item) => (
                <li
                  key={item}
                  className="relative pl-0 sm:border-l sm:border-stone-300 sm:pl-6 first:border-l-0 first:pl-0"
                >
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      </header>

      {featured ? (
        <section className="bg-white">
          <div className="site-container py-12">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-amber-800">
              Featured review
            </p>
            <div className="mt-5 grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.85fr)]">
              <FeaturedPrimary review={featured} />
              {secondary.length ? (
                <div className="divide-y divide-stone-200 border-t border-stone-200 lg:border-t-0">
                  {secondary.map((review) => (
                    <FeaturedSecondary key={review.id} review={review} />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {topicGroups.length ? (
        <section className="border-y border-stone-200 bg-[#f3f0ea]">
          <div className="site-container py-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Explore reviews</h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {topicGroups.map((group) => (
                <div key={group.key}>
                  <Link
                    href={`/reviews?category=${group.key}`}
                    className="text-sm font-bold text-slate-950 hover:text-blue-800"
                  >
                    {REVIEW_CATEGORY_META[group.key].label}
                  </Link>
                  {group.topics.length ? (
                    <ul className="mt-3 space-y-1.5">
                      {group.topics.map((topic) => (
                        <li key={topic}>
                          <Link
                            href={`/reviews?q=${encodeURIComponent(topic)}`}
                            className="text-[13px] text-slate-600 hover:text-blue-700"
                          >
                            {topic}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-[13px] leading-5 text-slate-500">
                      {REVIEW_CATEGORY_META[group.key].description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="site-container py-4">
        <AdBanner slot="content-top" collapseWhenEmpty />
      </div>

      {picks.length ? (
        <section className="bg-white">
          <div className="site-container py-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Worth reading</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {picks.map((review, index) => (
                <WorthReadingItem key={review.id} review={review} emphasis={index === 0} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white">
        <div className="site-container py-12">
          <ReviewsFeed reviews={reviews} initialQuery={query} initialCategory={initialCategory} />
        </div>
      </section>

      <section id="how-we-review" className="border-y border-stone-200 bg-[#eef3f8]">
        <div className="site-container grid gap-12 py-14 lg:grid-cols-[minmax(16rem,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">How we review</h2>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-slate-600">
              Our review process combines category-specific criteria, source research and documented
              editorial assessment.
            </p>
            <Link
              href="/authors/varnarc-editorial"
              className="mt-6 inline-flex h-11 items-center text-sm font-semibold text-blue-800 hover:underline"
            >
              Read our review methodology
            </Link>
          </div>
          <ol className="relative space-y-8 border-l border-slate-300 pl-6">
            {[
              [
                'Research',
                'Review official specifications, provider information, documentation and relevant sources.',
              ],
              [
                'Evaluate',
                'Assess criteria that matter for the specific product or service category.',
              ],
              ['Score', 'Apply documented editorial criteria where a Varnarc rating is used.'],
              ['Review & update', 'Revisit important information when meaningful changes occur.'],
            ].map(([title, body], index) => (
              <li key={title} className="relative">
                <span className="absolute -left-[1.85rem] top-0 grid h-5 w-5 place-items-center rounded-full bg-[#eef3f8] text-[11px] font-bold text-slate-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-lg font-bold text-slate-950">{title}</h3>
                <p className="mt-1 max-w-lg text-sm leading-6 text-slate-600">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white">
        <div className="site-container py-14">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              How to read our ratings
            </h2>
            <p className="mt-5 text-4xl font-extrabold text-slate-950">
              4.5 <span className="text-xl font-semibold text-slate-500">/ 5</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-amber-800">Varnarc Editorial Rating</p>
            <p className="mt-2 text-[12px] text-stone-500">
              Illustrative example. Live reviews show the published editorial score only when one
              exists.
            </p>
            <dl className="mt-8 grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-bold text-slate-950">Rating</dt>
                <dd className="mt-2 text-sm leading-6 text-slate-600">
                  A summary of our editorial assessment against relevant review criteria.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-bold text-slate-950">Criteria</dt>
                <dd className="mt-2 text-sm leading-6 text-slate-600">
                  Different categories may use different evaluation factors.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-bold text-slate-950">Context</dt>
                <dd className="mt-2 text-sm leading-6 text-slate-600">
                  A high rating does not mean a product is automatically right for every user.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-[#f7f4ee]">
        <div className="site-container py-14">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Our review standards</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-base font-bold text-slate-950">Clear criteria</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                We evaluate products using criteria relevant to their category.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950">Editorial independence</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Commercial relationships should not determine editorial conclusions.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950">Corrections &amp; updates</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Important inaccuracies or outdated information can be reported for review.
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
            <Link href="/authors/varnarc-editorial" className="text-blue-800 hover:underline">
              Editorial standards
            </Link>
            <Link href="/contact?type=correction" className="text-blue-800 hover:underline">
              Report a correction
            </Link>
          </div>
          <p className="mt-10 max-w-3xl border-t border-stone-200 pt-6 text-[13px] leading-6 text-slate-500">
            Varnarc reviews are provided for general research and informational purposes. Ratings
            reflect our editorial assessment at the time of review and may not reflect every
            user&apos;s priorities or experience. Prices, specifications, availability, fees and
            other details can change. Verify important information with the relevant manufacturer,
            provider or official source before making a decision.{' '}
            <Link href="/disclaimer" className="font-semibold text-blue-800 hover:underline">
              Read our disclaimer
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

function FeaturedPrimary({ review }: { review: ReviewListItem }) {
  const category = classifyReview(review);
  const score = parseEditorialScore(review.overallScore);
  const reviewer = reviewerLabel(review);
  const date = formatDate(reviewDate(review), 'MMM yyyy');
  const meta = category === 'other' ? null : REVIEW_CATEGORY_META[category];

  return (
    <article>
      {meta ? (
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-amber-800">
          {meta.badge}
        </p>
      ) : null}
      <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-[2.1rem] sm:leading-tight">
        <Link href={`/reviews/${review.slug}`} className="hover:text-blue-900">
          {review.title}
        </Link>
      </h2>
      {review.summary ? (
        <p className="mt-4 max-w-xl text-[16px] leading-7 text-slate-600">{review.summary}</p>
      ) : null}
      {score ? (
        <p className="mt-6">
          <span className="text-3xl font-extrabold text-slate-950">{score.value.toFixed(1)}</span>
          <span className="text-lg text-slate-500"> / {score.max}</span>
          <span className="mt-1 block text-sm font-semibold text-amber-800">{score.label}</span>
        </p>
      ) : null}
      <p className="mt-5 text-[13px] text-slate-500">
        Reviewed by{' '}
        <Link href={reviewer.href} className="font-medium text-slate-700 hover:underline">
          {reviewer.name}
        </Link>
        {date ? ` · Updated ${date}` : ''}
      </p>
      <Link
        href={`/reviews/${review.slug}`}
        className="mt-5 inline-flex h-11 items-center text-sm font-semibold text-blue-800 hover:underline"
      >
        Read full review
      </Link>
    </article>
  );
}

function FeaturedSecondary({ review }: { review: ReviewListItem }) {
  const category = classifyReview(review);
  const score = parseEditorialScore(review.overallScore);
  const meta = category === 'other' ? null : REVIEW_CATEGORY_META[category];

  return (
    <article className="py-6 first:pt-0 last:pb-0 lg:py-7">
      {meta ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800">
          {meta.badge}
        </p>
      ) : null}
      <h3 className="mt-2 text-lg font-bold leading-6 text-slate-950">
        <Link href={`/reviews/${review.slug}`} className="hover:text-blue-800">
          {review.title}
        </Link>
      </h3>
      {score ? (
        <p className="mt-2 text-sm font-bold text-slate-900">
          {score.value.toFixed(1)} / {score.max}
          <span className="ml-2 text-[11px] font-medium text-stone-500">{score.label}</span>
        </p>
      ) : null}
      <Link
        href={`/reviews/${review.slug}`}
        className="mt-3 inline-flex h-11 items-center text-sm font-semibold text-blue-800 hover:underline"
      >
        Read review
      </Link>
    </article>
  );
}

function WorthReadingItem({ review, emphasis }: { review: ReviewListItem; emphasis?: boolean }) {
  const category = classifyReview(review);
  const score = parseEditorialScore(review.overallScore);
  const date = formatDate(reviewDate(review), 'MMM yyyy');
  const meta = category === 'other' ? null : REVIEW_CATEGORY_META[category];

  return (
    <article className={emphasis ? 'md:col-span-1' : undefined}>
      {meta ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800">
          {meta.badge}
        </p>
      ) : null}
      <h3
        className={`mt-2 font-bold tracking-tight text-slate-950 ${emphasis ? 'text-2xl leading-8' : 'text-lg leading-6'}`}
      >
        <Link href={`/reviews/${review.slug}`} className="hover:text-blue-800">
          {review.title}
        </Link>
      </h3>
      {review.summary ? (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{review.summary}</p>
      ) : null}
      <p className="mt-3 text-[13px] text-slate-500">
        {score ? `${score.value.toFixed(1)} / ${score.max} · ` : ''}
        {date ? `Updated ${date}` : ''}
      </p>
      <Link
        href={`/reviews/${review.slug}`}
        className="mt-3 inline-flex h-11 items-center text-sm font-semibold text-blue-800 hover:underline"
      >
        Read
      </Link>
    </article>
  );
}
