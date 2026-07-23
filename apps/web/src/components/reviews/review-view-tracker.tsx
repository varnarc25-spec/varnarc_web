'use client';

import { useEffect } from 'react';

export function ReviewViewTracker({ reviewId }: { reviewId: string }) {
  useEffect(() => {
    void fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/reviews/${reviewId}/view`, {
      method: 'POST',
    }).catch(() => undefined);
  }, [reviewId]);

  return null;
}
