import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ProfessionalCardView } from '@/components/construction/professionals-directory/professional-card';
import { fetchProfessionalsDirectory } from '@/lib/construction/professionals-directory/api';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import {
  PROFESSIONAL_TYPES,
  PROFESSIONAL_SPECIALITIES,
  PROFESSIONAL_PROJECT_TYPES,
  PROFESSIONALS_DIRECTORY_CITIES,
  PROFESSIONALS_DIRECTORY_QUALIFICATION,
  PROFESSIONAL_INFO_SOURCES,
} from '@varnarc/validation';
import { cn, cx } from '@/components/construction/styles';

type Props = {
  searchParams: Promise<{
    location?: string;
    type?: string;
    speciality?: string;
    projectType?: string;
    verified?: string;
    sort?: string;
  }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('professionals', { searchParams: params });
}

export const revalidate = 120;

export default async function ConstructionProfessionalsPage({ searchParams }: Props) {
  const params = await searchParams;
  const directory = await fetchProfessionalsDirectory({
    location: params.location,
    type: params.type,
    speciality: params.speciality,
    projectType: params.projectType,
    verified: params.verified,
    sort: params.sort === 'recent' ? 'recent' : 'name',
    limit: 48,
  });

  const listings = directory?.listings ?? [];
  const sponsored = directory?.sponsoredListings ?? [];
  const qualification = directory?.qualification ?? PROFESSIONALS_DIRECTORY_QUALIFICATION;
  const infoSources = directory?.infoSources ?? [...PROFESSIONAL_INFO_SOURCES];

  function hrefWith(patch: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    const next = {
      location: params.location,
      type: params.type,
      speciality: params.speciality,
      projectType: params.projectType,
      verified: params.verified,
      sort: params.sort,
      ...patch,
    };
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
    }
    const qs = sp.toString();
    return qs ? `/construction/professionals?${qs}` : '/construction/professionals';
  }

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Professionals', path: '/construction/professionals' },
        ])}
      />
      <ContentLayout
        title="Construction professionals"
        description="Find contractors, architects, civil engineers and interior designers. Listings are not ranked as “best”."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Professionals' },
        ]}
      >
        <p className="mb-4 text-sm leading-relaxed text-slate-600">{qualification}</p>
        {directory?.meta.rankingNote ? (
          <p className="mb-2 text-xs text-slate-500">{directory.meta.rankingNote}</p>
        ) : null}
        {directory?.meta.reviewsNote ? (
          <p className="mb-6 text-xs text-slate-500">{directory.meta.reviewsNote}</p>
        ) : null}

        <section className="mb-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          {infoSources.map((s) => (
            <div key={s.key}>
              <h2 className="text-xs font-bold uppercase tracking-wide text-[#0b1f3a]">
                {s.label}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.description}</p>
            </div>
          ))}
        </section>

        <form
          method="get"
          action="/construction/professionals"
          className="mb-8 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Location</span>
            <select name="location" defaultValue={params.location ?? ''} className={cx.input}>
              <option value="">All cities</option>
              {PROFESSIONALS_DIRECTORY_CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Professional type</span>
            <select name="type" defaultValue={params.type ?? ''} className={cx.input}>
              <option value="">All types</option>
              {PROFESSIONAL_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.pluralLabel}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Speciality</span>
            <select name="speciality" defaultValue={params.speciality ?? ''} className={cx.input}>
              <option value="">Any</option>
              {PROFESSIONAL_SPECIALITIES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Project type</span>
            <select name="projectType" defaultValue={params.projectType ?? ''} className={cx.input}>
              <option value="">Any</option>
              {PROFESSIONAL_PROJECT_TYPES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Verified</span>
            <select name="verified" defaultValue={params.verified ?? ''} className={cx.input}>
              <option value="">Any</option>
              <option value="true">Verified information only</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Sort</span>
            <select name="sort" defaultValue={params.sort ?? 'name'} className={cx.input}>
              <option value="name">Name (A–Z)</option>
              <option value="recent">Recently updated</option>
            </select>
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <button type="submit" className={cx.primaryBtn}>
              Apply filters
            </button>
            {(params.location ||
              params.type ||
              params.speciality ||
              params.projectType ||
              params.verified) && (
              <Link href="/construction/professionals" className={cn(cx.secondaryBtn, 'ml-2')}>
                Clear
              </Link>
            )}
          </div>
        </form>

        <div className="mb-6 flex flex-wrap gap-2">
          {PROFESSIONAL_TYPES.map((t) => (
            <Link
              key={t.key}
              href={hrefWith({ type: t.key })}
              className={cn(
                'rounded-lg border px-3 py-1 text-xs font-semibold',
                params.type === t.key
                  ? 'border-[#0b1f3a] bg-[#0b1f3a] text-white'
                  : 'border-slate-200 bg-white text-slate-700',
              )}
            >
              {t.pluralLabel}
            </Link>
          ))}
        </div>

        {sponsored.length ? (
          <section className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#f97316]">
              Sponsored placements
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Clearly labelled sponsored listings — separate from directory sort and verification.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sponsored.map((p) => (
                <ProfessionalCardView key={p.id} professional={p} />
              ))}
            </div>
          </section>
        ) : null}

        {listings.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((p) => (
              <ProfessionalCardView key={p.id} professional={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No professional listings match"
            message="Try another city or type. Listings appear when directory businesses are tagged as contractors, architects, civil engineers or interior designers."
            action={
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/directory?vertical=construction"
                  className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white"
                >
                  Browse full directory
                </Link>
                <Link
                  href="/construction/suppliers"
                  className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Material suppliers
                </Link>
              </div>
            }
          />
        )}
      </ContentLayout>
    </>
  );
}
