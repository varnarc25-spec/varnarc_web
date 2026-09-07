'use client';

import { articleQualityHints } from '@varnarc/validation';

export function ArticleQualityHints({
  title,
  seoTitle,
  metaDescription,
  content,
}: {
  title: string;
  seoTitle: string;
  metaDescription: string;
  content: string;
}) {
  const hints = articleQualityHints(content, title, seoTitle, metaDescription);
  return (
    <dl className="grid grid-cols-2 gap-2 rounded-md border border-dashed border-[var(--varnarc-border)] p-3 text-xs text-[var(--varnarc-subtle)] md:grid-cols-4">
      <Hint label="Title" value={`${hints.titleLength} chars`} />
      <Hint label="SEO title" value={`${hints.seoTitleLength} chars`} />
      <Hint label="Meta desc" value={`${hints.metaDescriptionLength} chars`} />
      <Hint label="Words" value={`${hints.wordCount}`} />
      <Hint label="Read time" value={`${hints.readingMinutes} min`} />
      <Hint label="H2s" value={`${hints.h2Count}`} />
      <Hint label="Internal links" value={`${hints.internalLinks}`} />
      <Hint label="Missing image alt" value={`${hints.imagesMissingAlt}`} />
    </dl>
  );
}

function Hint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
