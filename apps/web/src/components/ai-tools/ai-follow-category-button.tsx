'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function AiFollowCategoryButton({
  categoryId,
  initialFollowing = false,
}: {
  categoryId: string;
  initialFollowing?: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setMessage(null);
    try {
      if (following) {
        const res = await fetch(`/api/ai-tools/follows/${categoryId}`, { method: 'DELETE' });
        const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        if (res.status === 401) {
          setMessage('Sign in to follow categories.');
          return;
        }
        if (!res.ok) throw new Error(json.error?.message || 'Unfollow failed');
        setFollowing(false);
        setMessage('Unfollowed.');
      } else {
        const res = await fetch('/api/ai-tools/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId }),
        });
        const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        if (res.status === 401) {
          setMessage('Sign in to follow categories.');
          return;
        }
        if (!res.ok) throw new Error(json.error?.message || 'Follow failed');
        setFollowing(true);
        setMessage('Following.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Follow failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => void toggle()}>
        {loading ? '…' : following ? 'Following' : 'Follow category'}
      </Button>
      {message ? <p className="text-xs text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
