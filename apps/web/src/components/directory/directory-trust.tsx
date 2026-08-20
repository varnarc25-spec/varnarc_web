import Link from 'next/link';
import { DIRECTORY_DISCLAIMER } from '@/lib/directory-hub';

export function DirectoryTrustSection() {
  return (
    <section
      aria-labelledby="directory-trust-heading"
      className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-8 sm:px-8"
    >
      <h2
        id="directory-trust-heading"
        className="text-2xl font-extrabold tracking-tight text-slate-950"
      >
        Finding the right provider matters.
      </h2>
      <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
        <li>
          Listings may be business-submitted or independently added. Presence in the directory is
          not an endorsement by itself.
        </li>
        <li>
          Verification status is labeled when available (listed, claimed, or verified). A verified
          badge appears only after verification.
        </li>
        <li>
          Ratings may come from Varnarc users or third parties and should identify their source. Do
          not treat unlabeled scores as authoritative.
        </li>
        <li>
          Independently check credentials, licences, insurance, pricing and suitability before
          hiring or purchasing.
        </li>
      </ul>
      <p className="mt-6 border-t border-slate-200 pt-5 text-[13px] leading-6 text-slate-600">
        {DIRECTORY_DISCLAIMER}{' '}
        <Link href="/disclaimer" className="font-semibold text-blue-700 hover:underline">
          Read our disclaimer
        </Link>
        .
      </p>
    </section>
  );
}
