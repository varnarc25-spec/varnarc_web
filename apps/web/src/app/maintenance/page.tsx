import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maintenance',
  robots: { index: false, follow: false },
};

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const message =
    params.message ??
    'We are performing scheduled maintenance. Please check back soon.';

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-[var(--varnarc-subtle)]">
        Maintenance
      </p>
      <h1 className="mt-3 text-3xl font-semibold">We&apos;ll be right back</h1>
      <p className="mt-4 text-[var(--varnarc-subtle)]">{message}</p>
    </main>
  );
}
