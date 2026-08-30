import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ProfessionalCardView } from '@/components/construction/professionals-directory/professional-card';
import {
  fetchProfessionalLanding,
  fetchProfessionalLandings,
} from '@/lib/construction/professionals-directory/api';
import { constructionHubBreadcrumbs } from '@/lib/construction/seo';
import {
  PROFESSIONALS_DIRECTORY_QUALIFICATION,
  getProfessionalType,
  isProfessionalTypeKey,
} from '@varnarc/validation';
import { cx } from '@/components/construction/styles';

type Props = {
  params: Promise<{ type: string; city: string }>;
};

export async function generateStaticParams() {
  const pairs = await fetchProfessionalLandings();
  return pairs.map((p) => ({ type: p.type, city: p.city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, city } = await params;
  const landing = await fetchProfessionalLanding(type, city);
  if (!landing) {
    return { title: 'Professionals', robots: { index: false, follow: false } };
  }
  return {
    title: `${landing.type.pluralLabel} in ${landing.city.name} | Varnarc`,
    description: `Browse ${landing.sampleSize} ${landing.type.label.toLowerCase()} listings in ${landing.city.name}. Not ranked as best — sponsored placements are labelled. Verified is not a professional certification.`,
    alternates: { canonical: landing.canonicalPath },
  };
}

export const revalidate = 300;

export default async function ProfessionalLandingPage({ params }: Props) {
  const { type, city } = await params;
  if (!isProfessionalTypeKey(type)) notFound();

  const landing = await fetchProfessionalLanding(type, city);
  if (!landing) notFound();

  const typeMeta = getProfessionalType(type);

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Professionals', path: '/construction/professionals' },
          {
            name: `${landing.type.pluralLabel} · ${landing.city.name}`,
            path: landing.canonicalPath,
          },
        ])}
      />
      <ContentLayout
        title={`${landing.type.pluralLabel} in ${landing.city.name}`}
        description={`${landing.sampleSize} listings with useful information. Sorted by name — not ranked as “best”.`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Professionals', href: '/construction/professionals' },
          { label: `${typeMeta?.pluralLabel ?? type} · ${landing.city.name}` },
        ]}
      >
        <p className="mb-6 text-sm text-slate-600">{landing.qualification}</p>

        {landing.sponsoredListings.length ? (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#f97316]">
              Sponsored placements
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {landing.sponsoredListings.map((p) => (
                <ProfessionalCardView key={p.id} professional={p} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {landing.listings
            .filter((l) => !l.sponsored)
            .map((p) => (
              <ProfessionalCardView key={p.id} professional={p} />
            ))}
        </div>

        <p className="mt-8 text-xs text-slate-500">{PROFESSIONALS_DIRECTORY_QUALIFICATION}</p>
        <Link
          href={`/construction/professionals?type=${type}&location=${city}`}
          className={cx.secondaryBtn + ' mt-4 inline-flex'}
        >
          Open filtered hub →
        </Link>
      </ContentLayout>
    </>
  );
}
