import Link from 'next/link';
import { Button } from '@varnarc/ui';

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--varnarc-subtle)]">
        404
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-[var(--varnarc-ink)]">Page not found</h1>
      <p className="mt-3 text-[var(--varnarc-subtle)]">
        The page you requested does not exist or was moved.
      </p>
      <Link href="/" className="mt-8">
        <Button>Back to home</Button>
      </Link>
    </main>
  );
}
