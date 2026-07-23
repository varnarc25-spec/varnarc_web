'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/shared/error-state';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[web] route error', error);
  }, [error]);

  return (
    <ErrorState
      title="Unable to load this page"
      message="Please try again. If the problem continues, come back later."
      onRetry={reset}
    />
  );
}
