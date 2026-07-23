'use client';

import { useEffect, useState } from 'react';
import { Button } from '@varnarc/ui';

export type SubscriptionType = 'newsletter' | 'category' | 'topic' | 'tag' | 'author';

type SubscribeButtonProps = {
  subscriptionType: SubscriptionType;
  target: string;
  label?: string;
  className?: string;
};

export function SubscribeButton({
  subscriptionType,
  target,
  label,
  className,
}: SubscribeButtonProps) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/subscriptions/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ subscriptionType, target }],
          }),
        });
        if (res.status === 401) {
          if (!cancelled) setAuthRequired(true);
          return;
        }
        const json = (await res.json()) as {
          data?: Array<{ subscribed?: boolean }>;
        };
        if (!cancelled) setSubscribed(Boolean(json.data?.[0]?.subscribed));
      } catch {
        if (!cancelled) setSubscribed(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subscriptionType, target]);

  async function toggle() {
    if (authRequired) {
      window.location.href = '/auth/login';
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/user/subscriptions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionType,
          target,
          subscribed: !subscribed,
        }),
      });
      if (res.status === 401) {
        window.location.href = '/auth/login';
        return;
      }
      const json = (await res.json()) as { data?: { subscribed?: boolean } };
      setSubscribed(Boolean(json.data?.subscribed));
    } finally {
      setLoading(false);
    }
  }

  const text = label ?? (subscribed ? 'Following' : 'Follow');

  return (
    <Button
      type="button"
      size="sm"
      variant={subscribed ? 'secondary' : 'primary'}
      className={className}
      disabled={loading}
      onClick={() => void toggle()}
    >
      {loading ? '…' : text}
    </Button>
  );
}
