import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  Car,
  House,
  ListChecks,
  Scale,
  SearchCheck,
  Sun,
  WalletCards,
} from 'lucide-react';
import { AdBanner } from '@/components/business/ad-banner';
import { CompareBuilder } from '@/components/compare/compare-builder';
import { CompareHeroPreview } from '@/components/compare/compare-hero-preview';
import { ComparePopular } from '@/components/compare/compare-popular';
import { CompareSearch } from '@/components/compare/compare-search';
import { RecentComparisons } from '@/components/compare/recent-comparisons';
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from '@/components/seo/json-ld';
import {
  COMPARE_CATEGORY_META,
  attachPreviewToCard,
  classifyComparisonText,
  compareHubIsIndexable,
  featuredPairFromCatalog,
  looksUnlikeForLike,
  loanGroupKey,
  parseVsTitle,
  type BuilderCategory,
  type CompareCard,
  type CompareCategoryKey,
} from '@/lib/compare-hub';
import { fetchAutomobileComparisons, fetchAutomobileVehicles } from '@/services/automobile';
import { fetchConstructionMaterials } from '@/services/construction';
import { fetchComparisons, type ComparisonListItem } from '@/services/content';
import { fetchFinanceCreditCards, fetchFinanceLoans } from '@/services/finance';

const COMPARE_HUB_TITLE = 'Compare Cars, Loans, Materials & Solar Options | Varnarc';
const COMPARE_HUB_DESCRIPTION =
  'Compare cars, financial products, construction materials and solar options side by side using structured data, calculators and verified sources.';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const indexable = compareHubIsIndexable(params);
  return {
    title: COMPARE_HUB_TITLE,
    description: COMPARE_HUB_DESCRIPTION,
    alternates: { canonical: '/compare' },
    robots: { index: indexable, follow: true },
    openGraph: {
      title: COMPARE_HUB_TITLE,
      description: COMPARE_HUB_DESCRIPTION,
      url: '/compare',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: COMPARE_HUB_TITLE,
      description: COMPARE_HUB_DESCRIPTION,
    },
  };
}

export const revalidate = 60;

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';

const CATEGORY_ICONS = {
  finance: WalletCards,
  cars: Car,
  home: House,
  solar: Sun,
  products: Scale,
} as const;

function numberValue(value: number | string | null | undefined) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value: number | string | null | undefined) {
  const parsed = numberValue(value);
  return parsed == null
    ? null
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
        notation: parsed >= 100_000 ? 'compact' : 'standard',
      }).format(parsed);
}

function previewRows(rows: Array<[string, string | number | null | undefined]>) {
  return rows.flatMap(([label, value]) =>
    value === null || value === undefined || value === '' ? [] : [{ label, value: String(value) }],
  );
}

function cardFromComparison(item: ComparisonListItem): CompareCard | null {
  const pair = parseVsTitle(item.title);
  if (!pair || looksUnlikeForLike(pair.a, pair.b)) return null;
  const category = classifyComparisonText(`${item.title} ${item.slug}`);
  if (category === 'other') return null;
  return {
    id: item.id,
    href: `/compare/${item.slug}`,
    title: item.title,
    category,
    optionA: pair.a,
    optionB: pair.b,
    dimensions: COMPARE_CATEGORY_META[category].dimensions,
  };
}

export default async function CompareHubPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? '';
  const initialCategory = (
    ['finance', 'cars', 'home', 'solar', 'products'] as CompareCategoryKey[]
  ).includes(params.category as CompareCategoryKey)
    ? (params.category as CompareCategoryKey)
    : undefined;

  const [comparisons, vehicles, loans, cards, materials, autoComparisons] = await Promise.all([
    fetchComparisons(50),
    fetchAutomobileVehicles({ limit: 40 }),
    fetchFinanceLoans({ limit: 40 }),
    fetchFinanceCreditCards({ limit: 24 }),
    fetchConstructionMaterials({ limit: 40 }),
    fetchAutomobileComparisons(),
  ]);

  const cmsCards = (comparisons.data ?? [])
    .map(cardFromComparison)
    .filter((card): card is CompareCard => Boolean(card));

  const autoCards = (autoComparisons.data ?? []).flatMap((item) => {
    const pair = parseVsTitle(item.title);
    if (!pair || looksUnlikeForLike(pair.a, pair.b)) return [];
    const card: CompareCard = {
      id: item.id,
      href: `/automobile/comparisons/${item.slug}`,
      title: item.title,
      category: 'cars',
      optionA: pair.a,
      optionB: pair.b,
      dimensions: COMPARE_CATEGORY_META.cars.dimensions,
    };
    return [card];
  });

  const builderCatalogs: BuilderCategory[] = [];

  const carOptions = (vehicles.data ?? []).map((vehicle) => ({
    id: vehicle.id,
    label: [vehicle.manufacturer?.name, vehicle.name].filter(Boolean).join(' ') || vehicle.name,
    group: (vehicle.bodyType || vehicle.category || 'vehicle').toLowerCase(),
    sortValue: numberValue(vehicle.exShowroomPrice),
    preview: previewRows([
      ['Price', money(vehicle.exShowroomPrice)],
      ['Mileage', vehicle.mileage ? `${vehicle.mileage} km/l` : null],
      ['Fuel', vehicle.fuelType],
      ['Transmission', vehicle.transmission],
      ['Safety', vehicle.safetyRating ? `${vehicle.safetyRating} rating` : null],
    ]),
  }));
  if (carOptions.length >= 2) {
    builderCatalogs.push({
      key: 'cars',
      label: 'Cars',
      hint: 'Only vehicles in the same body/category group can be compared.',
      options: carOptions,
    });
  }

  const loanOptions = (loans.data ?? []).map((loan) => ({
    id: loan.id,
    label: [loan.bank?.name, loan.name].filter(Boolean).join(' ') || loan.name,
    group: loanGroupKey(loan.loanType),
    sortValue: numberValue(loan.interestRateMin ?? loan.interestRate),
    preview: previewRows([
      [
        'Interest rate',
        loan.interestRateMin != null && loan.interestRateMax != null
          ? `${loan.interestRateMin}%–${loan.interestRateMax}%`
          : loan.interestRate != null
            ? `${loan.interestRate}%`
            : null,
      ],
      ['Rate type', loan.rateType],
      ['Loan type', loan.loanType],
      ['Processing fee', loan.processingFeeText ?? money(loan.processingFee)],
      [
        'Tenure',
        loan.tenureMin != null && loan.tenureMax != null
          ? `${loan.tenureMin}–${loan.tenureMax} months`
          : null,
      ],
    ]),
  }));
  const cardOptions = (cards.data ?? []).map((card) => ({
    id: card.id,
    label: [card.bank?.name, card.name].filter(Boolean).join(' ') || card.name,
    group: 'card:credit',
    sortValue: numberValue(card.annualFee),
    preview: previewRows([
      ['Annual fee', money(card.annualFee)],
      ['Joining fee', money(card.joiningFee)],
      ['Rewards', card.rewards],
      ['Cashback', card.cashback],
    ]),
  }));
  if ([...loanOptions, ...cardOptions].length >= 2) {
    builderCatalogs.push({
      key: 'finance',
      label: 'Finance',
      hint: 'Home loans compare with home loans, personal loans with personal loans, and cards with cards.',
      options: [...loanOptions, ...cardOptions],
    });
  }

  const materialOptions = (materials.data ?? []).map((material) => ({
    id: material.id,
    label: material.name,
    group: material.category?.slug || material.category?.name || 'material',
    sortValue: numberValue(material.approximatePrice),
    preview: previewRows([
      ['Approximate price', money(material.approximatePrice)],
      ['Unit', material.unit],
      ['Category', material.category?.name],
      ['Brand', material.brand?.name],
    ]),
  }));
  if (materialOptions.length >= 2) {
    builderCatalogs.push({
      key: 'home',
      label: 'Home & Construction',
      hint: 'Only materials in the same category can be compared — for example cement vs cement, not cement vs steel.',
      options: materialOptions,
    });
  }

  const catalogCards = builderCatalogs
    .map(featuredPairFromCatalog)
    .filter((card): card is CompareCard => Boolean(card));

  const allCards = [...autoCards, ...cmsCards, ...catalogCards]
    .map((card) => attachPreviewToCard(card, builderCatalogs))
    .filter((card, index, list) => list.findIndex((item) => item.href === card.href) === index);

  const enabledCategories = (Object.keys(COMPARE_CATEGORY_META) as CompareCategoryKey[]).filter(
    (key) => {
      if (key === 'solar') return true;
      if (key === 'products') return allCards.some((card) => card.category === 'products');
      return (
        builderCatalogs.some((item) => item.key === key) ||
        allCards.some((card) => card.category === key)
      );
    },
  );

  const popularLinks = [
    { label: 'Home loans', href: '/compare?q=home%20loan' },
    { label: 'Cars', href: '/compare?category=cars' },
    { label: 'Credit cards', href: '/compare?q=credit%20card' },
    { label: 'Solar', href: '/solar' },
  ];

  return (
    <main className="bg-white text-slate-950">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', url: `${SITE}/` },
            { name: 'Compare', url: `${SITE}/compare` },
          ]),
          itemListJsonLd({
            name: 'Varnarc comparisons',
            url: `${SITE}/compare`,
            items: allCards.slice(0, 12).map((card, index) => ({
              name: card.title,
              url: `${SITE}${card.href}`,
              position: index + 1,
            })),
          }),
        ]}
      />

      <div className="site-container">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 py-6 text-[13px] text-slate-500"
        >
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <span aria-hidden>›</span>
          <span className="font-semibold text-slate-800">Compare</span>
        </nav>

        <section className="grid items-start gap-8 pb-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-blue-600">
              Compare
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Compare options side by side.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Compare products, services and everyday choices using clear, structured information,
              calculators and source-backed details.
            </p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Review important differences before deciding.
            </p>
            <div className="mt-6">
              <CompareSearch initialQuery={query} cards={allCards} />
            </div>
            <p className="mt-3 text-[13px] text-slate-500">
              Popular:{' '}
              {popularLinks.map((link, index) => (
                <span key={link.href}>
                  <Link href={link.href} className="font-semibold text-blue-700 hover:underline">
                    {link.label}
                  </Link>
                  {index < popularLinks.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </p>
          </div>
          <CompareHeroPreview cards={allCards} />
        </section>
      </div>

      <div className="site-container">
        <AdBanner slot="content-top" collapseWhenEmpty />
      </div>

      <section className="bg-slate-50/80">
        <div className="site-container py-12">
          <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
            What do you want to compare?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Choose a category to find relevant comparisons and comparison tools.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {enabledCategories.map((key) => {
              const meta = COMPARE_CATEGORY_META[key];
              const Icon = CATEGORY_ICONS[key];
              return (
                <Link
                  key={key}
                  href={meta.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/70 transition hover:-translate-y-0.5 hover:border-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-950">{meta.label}</h3>
                  <p className="mt-1.5 text-[13px] leading-5 text-slate-600">{meta.description}</p>
                  <span className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-blue-700">
                    {meta.cta}{' '}
                    <ArrowRight
                      className="h-4 w-4 transition group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="site-container space-y-14 py-12">
        {builderCatalogs.length ? <CompareBuilder catalogs={builderCatalogs} /> : null}

        <ComparePopular cards={allCards} initialQuery={query} initialCategory={initialCategory} />

        <RecentComparisons />

        <section>
          <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
            How Varnarc comparisons work
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                n: '01',
                title: 'Select',
                body: 'Choose the two comparable options you want to evaluate.',
                icon: ListChecks,
              },
              {
                n: '02',
                title: 'Compare',
                body: 'See important differences in a consistent side-by-side format.',
                icon: Scale,
              },
              {
                n: '03',
                title: 'Calculate',
                body: 'Use relevant Varnarc calculators where useful.',
                icon: Calculator,
              },
              {
                n: '04',
                title: 'Verify',
                body: 'Review source details and official information before deciding.',
                icon: SearchCheck,
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <li key={step.n} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold tracking-[0.14em] text-slate-400">
                      {step.n}
                    </span>
                    <Icon className="h-5 w-5 text-blue-600" aria-hidden />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-slate-950">{step.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-5 text-slate-600">{step.body}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">Why use Varnarc Compare?</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Structured comparisons', 'Important attributes presented clearly side by side.'],
              ['Useful calculators', 'Relevant Varnarc tools linked where available.'],
              ['Source transparency', 'Important data sources and verification dates shown.'],
              ['Editorial separation', 'Comparison methodology is separate from paid placements.'],
              [
                'Review status',
                'Important pages show last reviewed or verified dates where available.',
              ],
            ].map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <BadgeCheck className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-950">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-5 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <p className="border-t border-slate-100 pt-6 text-[13px] leading-6 text-slate-500">
          Comparison information is provided for general research and educational purposes.
          Specifications, prices, rates, fees and availability can change. Verify important
          information with official manufacturers, providers or other authoritative sources before
          making a decision.{' '}
          <Link href="/disclaimer" className="font-semibold text-blue-700 hover:underline">
            Read our disclaimer
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
