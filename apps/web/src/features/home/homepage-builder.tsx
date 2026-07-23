import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@varnarc/ui';
import { ArticleCard } from '@/components/business/article-card';
import { articleCardPropsFromListItem } from '@/services/content';
import { ReviewCard } from '@/components/business/review-card';
import { CalculatorCard } from '@/components/business/calculator-card';
import { BusinessCard } from '@/components/business/business-card';
import { NewsletterForm } from '@/features/newsletter/newsletter-form';
import {
  ClassicHomeLayoutView,
  isClassicHomeLayout,
  type ClassicHomeData,
} from '@/features/home/classic-home-renderer';
import type {
  ArticleListItem,
  BusinessListItem,
  CalculatorListItem,
  ComparisonListItem,
  HomepageLayout,
  ReviewListItem,
  TrendingSearchItem,
} from '@/services/content';

type HomeData = ClassicHomeData & {
  layout: HomepageLayout | null;
};

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--varnarc-border)] bg-[linear-gradient(135deg,#0b3d5c_0%,#163f5f_45%,#1c4f6e_100%)] text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Varnarc</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Tools and insight for finance, home, and decisions that matter.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-white/80">
          Calculators, reviews, directories, and AI-assisted workflows.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/calculators">
            <Button className="bg-[var(--varnarc-accent)] hover:opacity-90">Explore tools</Button>
          </Link>
          <Link href="/articles">
            <Button
              variant="secondary"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              Read articles
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionShell({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--varnarc-ink)]">{title}</h2>
        <Link href={href} className="text-sm text-[var(--varnarc-brand)] hover:underline">
          View all
        </Link>
      </div>
      {children}
    </section>
  );
}

/**
 * Renders homepage from CMS layout. Classic variant matches the original marketing design.
 */
export function HomepageBuilder({ data }: { data: HomeData }) {
  const layout = data.layout;
  const hasLayout = Boolean(layout?.sections?.length);

  if (hasLayout && isClassicHomeLayout(layout)) {
    return <ClassicHomeLayoutView layout={layout!} data={data} />;
  }

  if (!hasLayout) {
    return (
      <main>
        <HeroSection />
        <SectionShell title="Latest articles" href="/articles">
          {data.articles.length ? (
            <div className="grid gap-6 md:grid-cols-3">
              {data.articles.slice(0, 6).map((a) => (
                <ArticleCard key={a.id} {...articleCardPropsFromListItem(a)} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--varnarc-subtle)]">No published articles yet.</p>
          )}
        </SectionShell>
      </main>
    );
  }

  const sections = [...(layout?.sections ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <main>
      {sections.map((section) => {
        const widgets = [...section.widgetInstances].sort((a, b) => a.sortOrder - b.sortOrder);
        const types = widgets.map((w) => w.widget.slug);

        if (types.includes('hero') || section.name.toLowerCase().includes('hero')) {
          return <HeroSection key={section.id} />;
        }

        if (types.includes('articles') || section.name.toLowerCase().includes('article')) {
          const widget = widgets.find((w) => w.widget.slug === 'articles');
          const settings = (widget?.settings || {}) as { source?: string; categoryId?: string };
          const source = settings.source || 'latest';
          let list: ArticleListItem[] = data.articles;
          if (source === 'featured') {
            list = data.featuredArticles?.length ? data.featuredArticles : data.articles;
          } else if (source === 'category' && settings.categoryId) {
            const byCategory = data.articlesByCategory?.[settings.categoryId];
            list = byCategory?.length ? byCategory : data.articles;
          }

          return (
            <SectionShell key={section.id} title={section.name} href="/articles">
              <div className="grid gap-6 md:grid-cols-3">
                {list.slice(0, 6).map((a) => (
                  <ArticleCard key={a.id} {...articleCardPropsFromListItem(a)} />
                ))}
              </div>
            </SectionShell>
          );
        }

        if (types.includes('calculators') || section.name.toLowerCase().includes('calculator')) {
          return (
            <SectionShell key={section.id} title={section.name} href="/calculators">
              <div className="grid gap-6 md:grid-cols-3">
                {data.calculators.slice(0, 6).map((c) => (
                  <CalculatorCard key={c.id} name={c.name} slug={c.slug} description={c.description} />
                ))}
              </div>
            </SectionShell>
          );
        }

        if (types.includes('reviews') || section.name.toLowerCase().includes('review')) {
          return (
            <SectionShell key={section.id} title={section.name} href="/reviews">
              <div className="grid gap-6 md:grid-cols-3">
                {data.reviews.slice(0, 6).map((r) => (
                  <ReviewCard
                    key={r.id}
                    title={r.title}
                    slug={r.slug}
                    score={r.overallScore != null ? Number(r.overallScore) : null}
                  />
                ))}
              </div>
            </SectionShell>
          );
        }

        if (types.includes('directory') || section.name.toLowerCase().includes('directory')) {
          return (
            <SectionShell key={section.id} title={section.name} href="/directory">
              <div className="grid gap-6 md:grid-cols-3">
                {data.businesses.slice(0, 6).map((b) => (
                  <BusinessCard key={b.id} name={b.name} slug={b.slug} description={b.description} />
                ))}
              </div>
            </SectionShell>
          );
        }

        if (types.includes('trending') || section.name.toLowerCase().includes('trending')) {
          const widget = widgets.find((w) => w.widget.slug === 'trending');
          const limit = Number((widget?.settings as { limit?: number })?.limit ?? 8);
          const keywords = (data.trending ?? []).slice(0, limit);

          return (
            <SectionShell key={section.id} title={section.name} href="/search">
              {keywords.length ? (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((item) => (
                    <Link
                      key={item.keyword}
                      href={`/search?q=${encodeURIComponent(item.keyword)}`}
                      className="rounded-full border border-[var(--varnarc-border)] px-4 py-2 text-sm text-[var(--varnarc-ink)] hover:border-[var(--varnarc-brand)] hover:text-[var(--varnarc-brand)]"
                    >
                      {item.keyword}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--varnarc-subtle)]">Trending searches will appear as visitors use site search.</p>
              )}
            </SectionShell>
          );
        }

        if (types.includes('newsletter') || section.name.toLowerCase().includes('newsletter')) {
          return (
            <section
              key={section.id}
              className="border-y border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]"
            >
              <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-14 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--varnarc-ink)]">{section.name}</h2>
                  <p className="mt-2 text-sm text-[var(--varnarc-subtle)]">
                    Get calculators, guides, and product updates in your inbox.
                  </p>
                </div>
                <NewsletterForm variant="inline" source="homepage" className="w-full max-w-md" />
              </div>
            </section>
          );
        }

        return (
          <section key={section.id} className="mx-auto max-w-6xl px-6 py-10">
            <h2 className="text-xl font-semibold text-[var(--varnarc-ink)]">{section.name}</h2>
            <p className="mt-2 text-sm text-[var(--varnarc-subtle)]">
              Configured section — add widgets in the homepage builder.
            </p>
          </section>
        );
      })}
    </main>
  );
}
