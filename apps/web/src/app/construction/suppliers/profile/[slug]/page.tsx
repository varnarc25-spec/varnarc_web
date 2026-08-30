import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { fetchSupplierProfile } from '@/lib/construction/supplier-directory/api';
import { constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { SUPPLIER_DIRECTORY_QUALIFICATION } from '@varnarc/validation';
import { cx } from '@/components/construction/styles';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const profile = await fetchSupplierProfile(slug);
  if (!profile) return { title: 'Supplier not found', robots: { index: false } };
  return {
    title: `${profile.businessName} | Construction suppliers`,
    description:
      profile.description?.slice(0, 155) ||
      `${profile.businessName} — construction supplier on Varnarc.`,
    alternates: { canonical: `/construction/suppliers/profile/${slug}` },
  };
}

export default async function SupplierProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = await fetchSupplierProfile(slug);
  if (!profile) notFound();

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Suppliers', path: '/construction/suppliers' },
          { name: profile.businessName, path: `/construction/suppliers/profile/${slug}` },
        ])}
      />
      <ContentLayout
        title={profile.businessName}
        description={profile.categoryLabels.join(' · ') || 'Construction supplier'}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Suppliers', href: '/construction/suppliers' },
          { label: profile.businessName },
        ]}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {profile.sponsored ? (
            <span className="rounded-full bg-[#f97316] px-3 py-1 text-xs font-semibold uppercase text-white">
              Sponsored
            </span>
          ) : null}
          {profile.verified ? (
            <span className="rounded-full bg-[#0b1f3a] px-3 py-1 text-xs font-semibold uppercase text-white">
              {profile.verificationLabel ?? 'Verified by Varnarc'}
            </span>
          ) : null}
        </div>

        {profile.description ? (
          <p className="max-w-3xl text-sm leading-relaxed text-slate-700">{profile.description}</p>
        ) : null}

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Categories
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {profile.categoryLabels.length ? profile.categoryLabels.join(', ') : '—'}
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
              Last updated
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {new Date(profile.lastUpdated).toLocaleDateString('en-IN')}
            </dd>
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
              Brands carried
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {profile.brands.length ? profile.brands.join(', ') : 'Not listed'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Verification
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              {profile.verified
                ? profile.verificationLabel
                : 'Not verified under Varnarc’s verification program'}
            </dd>
          </div>
        </dl>

        {profile.hoursAvailable ? (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-[#0b1f3a]">Business hours</h2>
            <ul className="mt-3 grid gap-1 sm:grid-cols-2">
              {profile.hours.map((h) => (
                <li key={h.dayLabel} className="text-sm text-slate-700">
                  <span className="font-medium">{h.dayLabel}:</span> {h.text}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-10 text-xs leading-relaxed text-slate-500">
          {profile.qualification || SUPPLIER_DIRECTORY_QUALIFICATION}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/construction/suppliers" className={cx.secondaryBtn}>
            ← All suppliers
          </Link>
          <Link href={`/directory/${profile.slug}`} className={cx.secondaryBtn}>
            Full directory profile
          </Link>
        </div>
      </ContentLayout>
    </>
  );
}
