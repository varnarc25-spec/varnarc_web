import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SettingsNav } from '@/components/settings/settings-nav';
import {
  ContactSettingsForm,
  type ContactSettings,
} from '@/components/settings/contact-settings-form';

export default async function ContactSettingsPage() {
  const result = await apiServerFetch<ContactSettings>('/settings/contact');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Contact email settings"
        description="Route contact form enquiries and manage delivery after messages are stored."
      />
      <SettingsNav active="/settings/contact" />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ContactSettingsForm initial={result.data ?? { emailEnabled: true }} />
      )}
    </div>
  );
}
