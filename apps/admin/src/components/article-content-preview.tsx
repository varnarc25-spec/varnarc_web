'use client';

import {
  looksLikeHtml,
  markdownToHtml,
  sanitizePreviewHtml,
} from '@/lib/article-content';

export function ArticleContentPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="rounded-md border border-dashed border-[var(--varnarc-border)] px-4 py-8 text-center text-sm text-[var(--varnarc-subtle)]">
        Nothing to preview yet. Generate a draft or write content in the editor.
      </p>
    );
  }

  const html = looksLikeHtml(content) ? content : markdownToHtml(content);

  return (
    <article
      className="prose prose-sm max-w-none min-h-[12rem] rounded-md border border-[var(--varnarc-border)] bg-white px-4 py-3 prose-headings:text-[var(--varnarc-ink)] prose-a:text-[var(--varnarc-brand)] prose-li:my-1"
      dangerouslySetInnerHTML={{ __html: sanitizePreviewHtml(html) }}
    />
  );
}
