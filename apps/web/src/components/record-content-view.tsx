'use client';

import { useEffect, useRef } from 'react';

type RecordContentViewProps = {
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

/**
 * Records a reading-history entry for authenticated users (fire-and-forget).
 */
export function RecordContentView({ entityType, entityId, metadata }: RecordContentViewProps) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    void fetch('/api/user/reading-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType,
        entityId,
        ...(metadata ? { metadata } : {}),
      }),
    }).catch(() => undefined);
  }, [entityType, entityId, metadata]);

  return null;
}
