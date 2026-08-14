import Link from 'next/link';
import {
  Briefcase,
  Building2,
  FileText,
  IdCard,
  Landmark,
  MapPin,
  type LucideIcon,
} from 'lucide-react';

const DOCUMENT_CARDS: Array<{
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
}> = [
  {
    id: 'identity-proof',
    title: 'Identity Proof',
    body: 'Examples may include PAN, Aadhaar, passport, or other lender-accepted alternatives — requirements are set by each lender.',
    icon: IdCard,
  },
  {
    id: 'address-proof',
    title: 'Address Proof',
    body: 'Proof of current residential address as accepted by the lender for KYC and verification.',
    icon: MapPin,
  },
  {
    id: 'income-proof',
    title: 'Income Proof',
    body: 'Salary slips, ITR, or equivalent documents depending on applicant type (salaried, self-employed, and others).',
    icon: FileText,
  },
  {
    id: 'bank-statements',
    title: 'Bank Statements',
    body: 'Recent account statements help lenders review cash flow and repayment capacity.',
    icon: Landmark,
  },
  {
    id: 'employment-business-proof',
    title: 'Employment / Business Proof',
    body: 'Employer letters, business registration, or similar proofs of occupation — what is asked varies by profile.',
    icon: Briefcase,
  },
  {
    id: 'property-asset-documents',
    title: 'Property / Asset Documents',
    body: 'Relevant mainly for secured loans such as home loans or loan against property — not required for every product.',
    icon: Building2,
  },
];

export function LoanDocumentsSection() {
  return (
    <section id="documents" aria-labelledby="loan-documents-heading">
      <div className="max-w-2xl">
        <h2
          id="loan-documents-heading"
          className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
        >
          Common Documents Required for Loans
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          Exact document requirements vary by lender and loan type.
        </p>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {DOCUMENT_CARDS.map((card) => (
          <li key={card.id}>
            <article className="flex h-full flex-col rounded-xl bg-[#f8fafc] p-3.5 sm:p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#0b1f3a] ring-1 ring-slate-200/80">
                <card.icon className="h-4 w-4" aria-hidden />
              </span>
              <h3 className="mt-2.5 text-sm font-bold text-[#0b1f3a]">{card.title}</h3>
              <p className="mt-1 flex-1 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
                {card.body}
              </p>
            </article>
          </li>
        ))}
      </ul>

      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-slate-500">
        Always confirm the checklist with your chosen lender before applying.{' '}
        <Link
          href="/finance/eligibility"
          className="font-semibold text-[#0b1f3a] hover:text-[#f97316]"
        >
          Check eligibility tools →
        </Link>
      </p>
    </section>
  );
}
