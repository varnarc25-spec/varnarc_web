import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@varnarc/ui';
import { DirectoryListingEditForm } from '@/components/directory-forms';
import { apiServerFetch } from '@/lib/api';

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
  seoTitle?: string | null;
  seoDescription?: string | null;
  faqs?: Array<{ question: string; answer: string }> | null;
  locations?: Array<{ address1: string; city: string; state?: string | null; country: string }>;
  services?: Array<{ name: string }>;
  products?: Array<{ name: string; price?: string | null }>;
  hours?: Array<{ day: number; openTime?: string | null; closeTime?: string | null; isClosed?: boolean }>;
  media?: Array<{ url?: string | null; kind: string; caption?: string | null }>;
};

export default async function DirectoryListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await apiServerFetch<Listing>(`/directory/listings/admin/${id}`);
  if (result.error || !result.data) notFound();

  return (
    <div>
      <PageHeader
        title={`Edit: ${result.data.name}`}
        description="Update listing details, media, services, products, and FAQs."
        actions={
          <Link href="/directory/listings" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back to listings
          </Link>
        }
      />
      <DirectoryListingEditForm listing={result.data} />
    </div>
  );
}
