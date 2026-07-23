'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@varnarc/ui';
import { SubscribeButton, type SubscriptionType } from '@/components/subscribe-button';

export type ContentSubscription = {
  id?: string;
  subscriptionType: SubscriptionType;
  target: string;
};

type Catalog = {
  categories: Array<{ slug: string; name: string }>;
  tags: Array<{ slug: string; name: string }>;
  topics: string[];
  authors: Array<{ username: string | null; displayName: string | null }>;
};

const TYPE_LABELS: Record<SubscriptionType, string> = {
  newsletter: 'Newsletter',
  category: 'Category',
  topic: 'Topic',
  tag: 'Tag',
  author: 'Author',
};

type FeedArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  readingTimeMinutes: number | null;
  author?: { username: string | null; displayName: string | null } | null;
  category?: { name: string; slug: string } | null;
};

export function SubscriptionsForm() {
  const [items, setItems] = useState<ContentSubscription[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [feed, setFeed] = useState<FeedArticle[]>([]);
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('category');
  const [target, setTarget] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch('/api/user/subscriptions').then((r) => r.json()),
      fetch('/api/user/subscriptions/catalog').then((r) => r.json()),
      fetch('/api/user/subscriptions/feed?limit=12').then((r) => r.json()),
    ]).then(([subsJson, catalogJson, feedJson]) => {
      setItems((subsJson as { data?: ContentSubscription[] }).data ?? []);
      setCatalog((catalogJson as { data?: Catalog }).data ?? null);
      setFeed((feedJson as { data?: { articles?: FeedArticle[] } }).data?.articles ?? []);
    });
  }, []);

  function addRow(nextType: SubscriptionType, nextTarget: string) {
    const trimmed = nextTarget.trim();
    if (!trimmed) return;
    const exists = items.some(
      (row) => row.subscriptionType === nextType && row.target === trimmed,
    );
    if (exists) {
      setMessage('Already subscribed to that.');
      return;
    }
    setItems((prev) => [...prev, { subscriptionType: nextType, target: trimmed }]);
    setTarget('');
    setMessage(null);
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions: items }),
      });
      const json = (await res.json()) as { error?: { message?: string }; data?: ContentSubscription[] };
      if (!res.ok) throw new Error(json.error?.message || 'Save failed');
      setItems(json.data ?? items);
      const feedRes = await fetch('/api/user/subscriptions/feed?limit=12');
      const feedJson = (await feedRes.json()) as { data?: { articles?: FeedArticle[] } };
      setFeed(feedJson.data?.articles ?? []);
      setMessage('Subscriptions updated.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  const pickerOptions: Array<{ slug: string; name: string }> =
    subscriptionType === 'category'
      ? catalog?.categories ?? []
      : subscriptionType === 'tag'
        ? catalog?.tags ?? []
        : subscriptionType === 'author'
          ? (catalog?.authors ?? [])
              .filter((author) => author.username)
              .map((author) => ({
                slug: author.username!,
                name: author.displayName || author.username!,
              }))
          : subscriptionType === 'topic'
            ? (catalog?.topics ?? []).map((topic) => ({ slug: topic, name: topic }))
            : [{ slug: 'weekly-digest', name: 'Weekly digest' }];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your feed</CardTitle>
        </CardHeader>
        <CardContent>
          {feed.length ? (
            <ul className="space-y-3">
              {feed.map((article) => (
                <li key={article.id} className="rounded-lg border border-[var(--varnarc-border)] p-3">
                  <Link
                    href={`/articles/${article.slug}`}
                    className="font-medium text-[var(--varnarc-brand)] hover:underline"
                  >
                    {article.title}
                  </Link>
                  {article.excerpt ? (
                    <p className="mt-1 text-sm text-[var(--varnarc-subtle)]">{article.excerpt}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--varnarc-subtle)]">
              Follow authors, categories, tags, or topics below to build a personalized article feed.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--varnarc-subtle)]">
            Follow authors, categories, topics, and tags. No payment required — this is content
            following only, not a paid plan.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
              value={subscriptionType}
              onChange={(e) => {
                setSubscriptionType(e.target.value as SubscriptionType);
                setTarget('');
              }}
            >
              {(Object.keys(TYPE_LABELS) as SubscriptionType[]).map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <select
              className="h-10 flex-1 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Select {TYPE_LABELS[subscriptionType].toLowerCase()}…</option>
              {pickerOptions.map((opt) => (
                <option key={opt.slug} value={opt.slug}>
                  {opt.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="secondary"
              onClick={() => addRow(subscriptionType, target)}
              disabled={!target}
            >
              Add
            </Button>
          </div>

          {items.length ? (
            <ul className="divide-y divide-[var(--varnarc-border)] rounded-lg border border-[var(--varnarc-border)]">
              {items.map((row, index) => (
                <li
                  key={`${row.subscriptionType}-${row.target}-${index}`}
                  className="flex items-center justify-between gap-3 p-3 text-sm"
                >
                  <span>
                    <span className="font-medium text-[var(--varnarc-ink)]">
                      {TYPE_LABELS[row.subscriptionType]}
                    </span>
                    <span className="text-[var(--varnarc-subtle)]"> · {row.target}</span>
                  </span>
                  <Button type="button" variant="ghost" onClick={() => removeRow(index)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--varnarc-subtle)]">No subscriptions yet.</p>
          )}

          <Button type="button" disabled={loading} onClick={() => void save()}>
            Save subscriptions
          </Button>
          {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
        </CardContent>
      </Card>

      {catalog?.authors.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Popular authors</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {catalog.authors
              .filter((author) => author.username)
              .map((author) => (
                <SubscribeButton
                  key={author.username!}
                  subscriptionType="author"
                  target={author.username!}
                  label={author.displayName || author.username!}
                />
              ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
