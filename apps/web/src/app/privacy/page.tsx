import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { legalContent } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: legalContent.privacy.description,
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPolicyPage() {
  const { title, description, sections } = legalContent.privacy;
  return <LegalPage title={title} description={description} sections={sections} breadcrumbLabel="Privacy Policy" />;
}
