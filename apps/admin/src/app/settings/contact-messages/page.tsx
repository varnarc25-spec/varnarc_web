import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SettingsNav } from '@/components/settings/settings-nav';

type ContactMessage = {
  id: string;
  topic: string;
  destination: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  createdAt: string;
  sentAt?: string | null;
  emailError?: string | null;
};

export default async function ContactMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.status) qs.set('status', params.status);

  const result = await apiServerFetch<ContactMessage[]>(`/contact/messages?${qs.toString()}`);
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Contact messages"
        description="Enquiries submitted from the public contact form. Messages are stored before email delivery."
      />
      <SettingsNav active="/settings/contact-messages" />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/settings/contact" className="text-[var(--varnarc-brand)] hover:underline">
          Email settings
        </Link>
        {['', 'NEW', 'SENT', 'FAILED', 'SPAM', 'ARCHIVED'].map((status) => (
          <Link
            key={status || 'all'}
            href={
              status ? `/settings/contact-messages?status=${status}` : '/settings/contact-messages'
            }
            className={
              (params.status || '') === status
                ? 'font-medium text-[var(--varnarc-brand)]'
                : 'text-[var(--varnarc-subtle)] hover:underline'
            }
          >
            {status || 'All'}
          </Link>
        ))}
      </div>

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No messages yet</CardTitle>
            <CardDescription>New contact form submissions will appear here.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Topic</th>
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{row.topic}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.name}</div>
                    <div className="text-[var(--varnarc-subtle)]">{row.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/settings/contact-messages/${row.id}`}
                      className="text-[var(--varnarc-brand)] hover:underline"
                    >
                      {row.subject}
                    </Link>
                    {row.emailError ? (
                      <p className="mt-1 text-xs text-red-700">{row.emailError}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
