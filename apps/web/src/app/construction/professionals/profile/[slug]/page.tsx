import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { JsonLd } from '@/components/seo/json-ld';
import { fetchProfessionalProfile } from '@/lib/construction/professionals-directory/api';
import { constructionHubBreadcrumbs } from '@/lib/construction/seo';
import {
  PROFESSIONALS_DIRECTORY_QUALIFICATION,
  buildProfessionalStructuredData,
} from '@varnarc/validation';
import { cx } from '@/components/construction/styles';

type Props = { params: Promise<{ slug: string }> };

const siteUrl = () =>
  (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_WEB_URL ??
    'https://varnarc.com'
  ).replace(/\/$/, '');

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const profile = await fetchProfessionalProfile(slug);
  if (!profile) return { title: 'Professional not found', robots: { index: false } };
  return {
    title: `${profile.businessName} | Construction professionals`,
    description:
      profile.description?.slice(0, 155) ||
      `${profile.businessName} — construction professional listing on Varnarc.`,
    alternates: { canonical: `/construction/professionals/profile/${slug}` },
  };
}

export default async function ProfessionalProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = await fetchProfessionalProfile(slug);
  if (!profile) notFound();

  const primaryType = profile.professionalTypes[0]?.key as
    'contractor' | 'architect' | 'civil_engineer' | 'interior_designer' | undefined;

  const structured = profile.structuredDataEligible
    ? buildProfessionalStructuredData({
        name: profile.businessName,
        description: profile.description,
        url: `${siteUrl()}${profile.href}`,
        phone: profile.contact.phone,
        email: profile.contact.email,
        city: profile.location.city,
        state: profile.location.state,
        professionalTypeKey: primaryType ?? null,
        sameAs: profile.contact.website ? [profile.contact.website] : undefined,
      })
    : null;

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Professionals', path: '/construction/professionals' },
          {
            name: profile.businessName,
            path: `/construction/professionals/profile/${slug}`,
          },
        ])}
      />
      {structured ? <JsonLd data={structured} /> : null}
      <ContentLayout
        title={profile.businessName}
        description={profile.professionalTypeLabels.join(' · ') || 'Construction professional'}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Professionals', href: '/construction/professionals' },
          { label: profile.businessName },
        ]}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {profile.sourceBadges.map((b) => (
            <span
              key={b.key}
              className={
                b.key === 'sponsored_listing'
                  ? 'rounded-full bg-[#f97316] px-3 py-1 text-xs font-semibold uppercase text-white'
                  : b.key === 'verified_information'
                    ? 'rounded-full bg-[#0b1f3a] px-3 py-1 text-xs font-semibold uppercase text-white'
                    : 'rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase text-slate-700'
              }
            >
              {b.label}
            </span>
          ))}
        </div>

        {profile.description ? (
          <p className="max-w-3xl text-sm leading-relaxed text-slate-700">{profile.description}</p>
        ) : null}

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Professional type
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {profile.professionalTypeLabels.length
                ? profile.professionalTypeLabels.join(', ')
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Location
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {[profile.location.locality, profile.location.city, profile.location.state]
                .filter(Boolean)
                .join(', ') || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Experience
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {profile.experienceYears != null
                ? `${profile.experienceYears}+ years (directory listing)`
                : 'Not listed'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Specialities
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {profile.specialities.length ? profile.specialities.join(', ') : 'Not listed'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Project types
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {profile.projectTypes.length ? profile.projectTypes.join(', ') : 'Not listed'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Service area
            </dt>
            <dd className="mt-1 text-sm text-slate-800">{profile.serviceArea || 'Not listed'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contact
            </dt>
            <dd className="mt-1 space-y-1 text-sm text-slate-800">
              {profile.contact.phone ? <p>Phone: {profile.contact.phone}</p> : null}
              {profile.contact.whatsapp ? <p>WhatsApp: {profile.contact.whatsapp}</p> : null}
              {profile.contact.email ? <p>Email: {profile.contact.email}</p> : null}
              {profile.contact.website ? (
                <p>
                  <a
                    href={profile.contact.website}
                    className="font-semibold text-[#f97316]"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Website
                  </a>
                </p>
              ) : null}
              {!profile.contact.phone &&
              !profile.contact.whatsapp &&
              !profile.contact.email &&
              !profile.contact.website
                ? '—'
                : null}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Verification information
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {profile.verified ? (
                <>
                  <p>{profile.verificationLabel ?? 'Verified information'}</p>
                  <p className="mt-1 text-xs text-slate-500">{profile.verificationNote}</p>
                </>
              ) : (
                'Not verified under Varnarc’s verification program — directory listing only'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              User reviews
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              Not available yet. When added, reviews will appear separately from verified
              information.
            </dd>
          </div>
        </dl>

        {profile.portfolio.length ? (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-[#0b1f3a]">Portfolio</h2>
            <p className="mt-1 text-xs text-slate-500">
              Self-reported project highlights from the directory listing.
            </p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {profile.portfolio.map((item) => (
                <li
                  key={`${item.title}-${item.url ?? ''}`}
                  className="rounded-lg border border-slate-200 bg-white p-4 text-sm"
                >
                  <p className="font-semibold text-[#0b1f3a]">{item.title}</p>
                  {item.url ? (
                    <a
                      href={item.url}
                      className="mt-1 inline-block text-[#f97316]"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      View project
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {profile.services.length ? (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-[#0b1f3a]">Services</h2>
            <ul className="mt-3 space-y-2">
              {profile.services.map((s) => (
                <li key={s.name} className="text-sm text-slate-700">
                  <span className="font-medium">{s.name}</span>
                  {s.description ? ` — ${s.description}` : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-10 text-xs leading-relaxed text-slate-500">
          {profile.qualification || PROFESSIONALS_DIRECTORY_QUALIFICATION}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/construction/professionals" className={cx.secondaryBtn}>
            ← All professionals
          </Link>
          <Link href={`/directory/${profile.slug}`} className={cx.secondaryBtn}>
            Full directory profile
          </Link>
        </div>
      </ContentLayout>
    </>
  );
}
