import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { legalContent } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: legalContent.terms.description,
  alternates: { canonical: '/terms' },
};

export default function TermsofServicePage() {
  const { title, description, sections } = legalContent.terms;
  return <LegalPage title={title} description={description} sections={sections} breadcrumbLabel="Terms of Service" />;
}
