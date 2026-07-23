'use client';

import { SubscribeButton } from '@/components/subscribe-button';

type ArticleSubscribeBarProps = {
  author?: { username: string | null; displayName: string | null } | null;
  category?: { slug: string; name: string } | null;
  tags?: Array<{ slug: string; name: string }>;
};

export function ArticleSubscribeBar({ author, category, tags = [] }: ArticleSubscribeBarProps) {
  const hasAny = Boolean(author?.username || category?.slug || tags.length);
  if (!hasAny) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)]/50 p-3">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--varnarc-subtle)]">
        Follow updates
      </span>
      {author?.username ? (
        <SubscribeButton
          subscriptionType="author"
          target={author.username}
          label={`Author: ${author.displayName || author.username}`}
        />
      ) : null}
      {category?.slug ? (
        <SubscribeButton
          subscriptionType="category"
          target={category.slug}
          label={`Category: ${category.name}`}
        />
      ) : null}
      {tags.slice(0, 3).map((tag) => (
        <SubscribeButton
          key={tag.slug}
          subscriptionType="tag"
          target={tag.slug}
          label={`Tag: ${tag.name}`}
        />
      ))}
    </div>
  );
}
