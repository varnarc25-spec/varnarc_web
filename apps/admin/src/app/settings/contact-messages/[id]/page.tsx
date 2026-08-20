import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SettingsNav } from '@/components/settings/settings-nav';
import { ContactMessageStatusForm } from '@/components/settings/contact-message-status-form';

type ContactMessage = {
  id: string;
  topic: string;
  destination: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  company?: string | null;
  orgWebsite?: string | null;
  pageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  status: string;
  emailError?: string | null;
  sentAt?: string | null;
  createdAt: string;
};

export default async function ContactMessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await apiServerFetch<ContactMessage>(`/contact/messages/${id}`);
  if (result.error || !result.data) notFound();
  const row = result.data;

  return (
    <div className="space-y-8">
      <PageHeader title={row.subject} description={`From ${row.name} · ${row.email}`} />
      <SettingsNav active="/settings/contact-messages" />
      <p className="text-sm">
        <Link
          href="/settings/contact-messages"
          className="text-[var(--varnarc-brand)] hover:underline"
        >
          ← All messages
        </Link>
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Enquiry details</CardTitle>
          <CardDescription>
            {row.topic} · {row.destination} · {row.status} ·{' '}
            {new Date(row.createdAt).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <div className="space-y-3 px-6 pb-6 text-sm">
          {row.company ? (
            <p>
              <span className="font-medium">Company:</span> {row.company}
            </p>
          ) : null}
          {row.orgWebsite ? (
            <p>
              <span className="font-medium">Website:</span> {row.orgWebsite}
            </p>
          ) : null}
          {row.pageUrl ? (
            <p>
              <span className="font-medium">Page URL:</span> {row.pageUrl}
            </p>
          ) : null}
          {row.sentAt ? (
            <p>
              <span className="font-medium">Emailed at:</span>{' '}
              {new Date(row.sentAt).toLocaleString()}
            </p>
          ) : null}
          {row.emailError ? (
            <p className="text-red-700">
              <span className="font-medium">Email error:</span> {row.emailError}
            </p>
          ) : null}
          <div className="rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] p-4 whitespace-pre-wrap">
            {row.message}
          </div>
          <ContactMessageStatusForm id={row.id} initialStatus={row.status} />
        </div>
      </Card>
    </div>
  );
}
