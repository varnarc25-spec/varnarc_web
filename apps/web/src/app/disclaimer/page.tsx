import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { legalContent } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: legalContent.disclaimer.description,
  alternates: { canonical: '/disclaimer' },
};

export default function DisclaimerPage() {
  const { title, description, sections } = legalContent.disclaimer;
  return <LegalPage title={title} description={description} sections={sections} breadcrumbLabel="Disclaimer" />;
}
