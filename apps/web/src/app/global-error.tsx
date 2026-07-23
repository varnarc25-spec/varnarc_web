'use client';

import { useEffect } from 'react';
import { Button } from '@varnarc/ui';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[web] uncaught error', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-sm text-neutral-600">
            An unexpected error occurred. You can try again.
          </p>
          <Button className="mt-6" type="button" onClick={reset}>
            Try again
          </Button>
        </main>
      </body>
    </html>
  );
}
