import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DirectoryContactWidget } from '@/components/directory/directory-contact-widget';
import { DirectoryGallery } from '@/components/directory/directory-gallery';
import { ListingLeadForm } from '@/components/directory/directory-widgets';
import { DirectoryListingCard } from '@/components/directory/directory-listing-card';
import { faqJsonLd, localBusinessJsonLd, organizationJsonLd } from '@/components/seo/json-ld';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { UserReviewWidget } from '@/components/reviews/user-review-widget';
import { RecordContentView } from '@/components/record-content-view';
import { apiPublicFetch, ApiError } from '@/services/api-client';

type Props = { params: Promise<{ slug: string }> };

type Faq = { question: string; answer: string };

type Listing = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  contactPerson?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  pricing?: string | null;
  certifications?: unknown;
  faqs?: Faq[] | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  featured?: boolean;
  sponsored?: boolean;
  verificationStatus?: string;
  locations?: Array<{
    city: string;
    state?: string | null;
    country: string;
    address1: string;
    latitude?: string | number | null;
    longitude?: string | number | null;
    googleMapsUrl?: string | null;
  }>;
  services?: Array<{ name: string; description?: string | null }>;
  products?: Array<{ name: string; price?: string | null; description?: string | null }>;
  hours?: Array<{ day: number; openTime?: string | null; closeTime?: string | null; isClosed?: boolean }>;
  categories?: Array<{ category: { name: string; slug: string } }>;
  media?: Array<{ url?: string | null; kind: string; caption?: string | null }>;
  _count?: { reviews: number };
};

type RelatedResponse = {
  ratingSummary?: { averageRating?: number | string | null; totalRatings?: number };
  userReviews?: Array<{
    id: string;
    rating: number | string;
    title?: string | null;
    comment?: string | null;
    user?: { displayName?: string | null; email?: string | null } | null;
  }>;
  editorialReviews?: Array<{ id: string; title: string; slug: string }>;
  comparisons?: Array<{ id: string; title: string; slug: string }>;
  relatedBusinesses?: Array<{ id: string; name: string; slug: string; description?: string | null }>;
  nearby?: Array<{ id: string; name: string; slug: string; description?: string | null }>;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseFaqs(value: unknown): Faq[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Faq =>
      typeof item === 'object' &&
      item !== null &&
      'question' in item &&
      'answer' in item &&
      typeof (item as Faq).question === 'string' &&
      typeof (item as Faq).answer === 'string',
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await apiPublicFetch<Listing>(`/directory/listings/slug/${slug}`, {
      next: { revalidate: 60 },
    });
    return buildSeoMetadata({
      entityType: 'business',
      entityId: data.id,
      path: `/directory/${data.slug}`,
      title: data.seoTitle || data.name,
      description: data.seoDescription || data.description,
      image: data.coverImageUrl || data.logoUrl,
    });
  } catch {
    return { title: 'Business' };
  }
}

export default async function BusinessDetailPage({ params }: Props) {
  const { slug } = await params;
  try {
    const { data } = await apiPublicFetch<Listing>(`/directory/listings/slug/${slug}`, {
      next: { revalidate: 60 },
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
    void fetch(`${apiUrl}/directory/listings/${data.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'VIEW' }),
    }).catch(() => undefined);

    const relatedResult = await apiPublicFetch<RelatedResponse>(`/directory/listings/slug/${slug}/related`, {
      next: { revalidate: 60 },
    }).catch(() => ({ data: {} as RelatedResponse }));

    const related = relatedResult.data ?? {};
    const faqs = parseFaqs(data.faqs);
    const primary = data.locations?.[0];
    const hasGeo = primary?.latitude != null && primary?.longitude != null;
    const ratingSummary = related.ratingSummary;
    const avgRating = ratingSummary?.averageRating != null ? Number(ratingSummary.averageRating) : null;
    const totalRatings = ratingSummary?.totalRatings ?? 0;

    const structuredData = hasGeo
      ? localBusinessJsonLd({
          name: data.name,
          description: data.description,
          url: data.website,
          phone: data.phone,
          email: data.email,
          image: data.coverImageUrl || data.logoUrl,
          address: primary
            ? {
                streetAddress: primary.address1,
                addressLocality: primary.city,
                addressRegion: primary.state,
                addressCountry: primary.country,
              }
            : undefined,
          geo: hasGeo
            ? { latitude: Number(primary!.latitude), longitude: Number(primary!.longitude) }
            : undefined,
          aggregateRating:
            avgRating != null && totalRatings > 0
              ? { ratingValue: avgRating, reviewCount: totalRatings }
              : undefined,
        })
      : organizationJsonLd({
          name: data.name,
          description: data.description,
          url: data.website,
          logo: data.logoUrl,
        });

    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
        { '@type': 'ListItem', position: 2, name: 'Directory', item: '/directory' },
        { '@type': 'ListItem', position: 3, name: data.name },
      ],
    };

    return (
      <main className="site-container py-12">
        <RecordContentView
          entityType="directory"
          entityId={data.id}
          metadata={{ slug: data.slug, title: data.name }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
        {faqs.length ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />
        ) : null}

        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Directory', href: '/directory' },
            ...(data.categories?.[0]
              ? [{ label: data.categories[0].category.name, href: `/directory/${data.categories[0].category.slug}` }]
              : []),
            { label: data.name },
          ]}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold text-[var(--varnarc-ink)]">{data.name}</h1>
          {data.verificationStatus === 'VERIFIED' ? (
            <span className="rounded bg-[var(--varnarc-muted)] px-2 py-0.5 text-xs">Verified</span>
          ) : null}
          {data.featured ? (
            <span className="rounded bg-[var(--varnarc-muted)] px-2 py-0.5 text-xs">Featured</span>
          ) : null}
          {data.sponsored ? (
            <span className="rounded bg-[var(--varnarc-muted)] px-2 py-0.5 text-xs">Sponsored</span>
          ) : null}
        </div>

        {avgRating != null && totalRatings > 0 ? (
          <p className="mt-2 text-sm text-amber-600">
            {avgRating.toFixed(1)} / 5 · {totalRatings} review{totalRatings === 1 ? '' : 's'}
          </p>
        ) : null}

        {data.description ? (
          <p className="mt-4 text-[var(--varnarc-subtle)]">{data.description}</p>
        ) : null}

        <div className="mt-8">
          <DirectoryGallery logoUrl={data.logoUrl} coverImageUrl={data.coverImageUrl} media={data.media} />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">
            {data.contactPerson ? (
              <p className="text-sm">
                <span className="font-medium">Contact person:</span> {data.contactPerson}
              </p>
            ) : null}

            {(data.locations ?? []).length ? (
              <section>
                <h2 className="font-semibold">Locations</h2>
                <ul className="mt-3 space-y-2 text-sm text-[var(--varnarc-subtle)]">
                  {data.locations!.map((l, i) => (
                    <li key={i}>
                      {l.address1}, {l.city}
                      {l.state ? `, ${l.state}` : ''}, {l.country}
                      {l.googleMapsUrl ? (
                        <>
                          {' · '}
                          <a className="text-[var(--varnarc-brand)] hover:underline" href={l.googleMapsUrl} rel="noopener noreferrer">
                            Map
                          </a>
                        </>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {data.pricing ? (
              <section>
                <h2 className="font-semibold">Pricing</h2>
                <p className="mt-2 text-sm text-[var(--varnarc-subtle)]">{data.pricing}</p>
              </section>
            ) : null}

            {(data.services ?? []).length ? (
              <section>
                <h2 className="font-semibold">Services</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {data.services!.map((s) => (
                    <li key={s.name}>{s.name}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {(data.products ?? []).length ? (
              <section>
                <h2 className="font-semibold">Products</h2>
                <ul className="mt-3 space-y-1 text-sm">
                  {data.products!.map((p) => (
                    <li key={p.name}>
                      {p.name}
                      {p.price ? <span className="text-[var(--varnarc-subtle)]"> — {p.price}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {(data.hours ?? []).length ? (
              <section>
                <h2 className="font-semibold">Hours</h2>
                <ul className="mt-3 space-y-1 text-sm">
                  {data.hours!.map((h) => (
                    <li key={h.day}>
                      {DAY_NAMES[h.day] ?? h.day}:{' '}
                      {h.isClosed ? 'Closed' : `${h.openTime ?? '—'} – ${h.closeTime ?? '—'}`}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {faqs.length ? (
              <section>
                <h2 className="font-semibold">FAQs</h2>
                <dl className="mt-3 space-y-4">
                  {faqs.map((faq) => (
                    <div key={faq.question}>
                      <dt className="font-medium">{faq.question}</dt>
                      <dd className="mt-1 text-sm text-[var(--varnarc-subtle)]">{faq.answer}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {(related.comparisons ?? []).length ? (
              <section>
                <h2 className="font-semibold">Comparisons</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {related.comparisons!.map((c) => (
                    <li key={c.id}>
                      <Link href={`/compare/${c.slug}`} className="text-[var(--varnarc-brand)] hover:underline">
                        {c.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {(related.relatedBusinesses ?? []).length ? (
              <section>
                <h2 className="font-semibold">Related businesses</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {related.relatedBusinesses!.map((b) => (
                    <DirectoryListingCard key={b.id} name={b.name} slug={b.slug} description={b.description} />
                  ))}
                </div>
              </section>
            ) : null}

            {(related.nearby ?? []).length ? (
              <section>
                <h2 className="font-semibold">Nearby listings</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {related.nearby!.map((n) => (
                    <li key={n.id}>
                      <Link href={`/directory/${n.slug}`} className="text-[var(--varnarc-brand)] hover:underline">
                        {n.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <UserReviewWidget
              entityType="directory_listing"
              entityId={data.id}
              initialReviews={related.userReviews ?? []}
              averageRating={avgRating}
              totalRatings={totalRatings}
            />

            {(related.editorialReviews ?? []).length ? (
              <section>
                <h2 className="font-semibold">Editorial reviews</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {related.editorialReviews!.map((r) => (
                    <li key={r.id}>
                      <Link href={`/reviews/${r.slug}`} className="text-[var(--varnarc-brand)] hover:underline">
                        {r.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4">
            <DirectoryContactWidget
              listingId={data.id}
              phone={data.phone}
              email={data.email}
              whatsapp={data.whatsapp}
              website={data.website}
            />
            <ListingLeadForm listingId={data.id} />
          </aside>
        </div>
      </main>
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      // Fall through to category page handling below
    } else if (!(e instanceof ApiError)) {
      throw e;
    } else if (e.status !== 404) {
      throw e;
    }
  }

  try {
    const { data: category } = await apiPublicFetch<{
      id: string;
      name: string;
      slug: string;
      description?: string | null;
      children?: Array<{ id: string; name: string; slug: string }>;
    }>(`/directory/categories/slug/${slug}`, { next: { revalidate: 60 } });

    const { data: listings } = await apiPublicFetch<
      Array<{ id: string; name: string; slug: string; description?: string | null }>
    >(`/directory/search?category=${slug}&limit=24`, { next: { revalidate: 60 } });

    return (
      <main className="site-container py-12">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Directory', href: '/directory' },
            { label: category.name },
          ]}
        />
        <h1 className="mt-4 text-3xl font-semibold">{category.name}</h1>
        {category.description ? <p className="mt-3 text-[var(--varnarc-subtle)]">{category.description}</p> : null}

        {(category.children ?? []).length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {category.children!.map((c) => (
              <Link
                key={c.id}
                href={`/directory/${c.slug}`}
                className="rounded-md border border-[var(--varnarc-border)] px-3 py-1.5 text-sm hover:bg-[var(--varnarc-muted)]"
              >
                {c.name}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(listings ?? []).map((b) => (
            <DirectoryListingCard key={b.id} name={b.name} slug={b.slug} description={b.description} />
          ))}
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
