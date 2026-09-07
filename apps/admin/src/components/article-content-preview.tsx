'use client';

import {
  extractArticleToc,
  looksLikeHtml,
  sanitizeArticleHtml,
  splitArticleWidgets,
} from '@varnarc/validation';
import { markdownToHtml } from '@/lib/article-content';

export function ArticleContentPreview({
  content,
  articleStyle = 'default',
}: {
  content: string;
  articleStyle?: string;
}) {
  if (!content.trim()) {
    return (
      <p className="rounded-md border border-dashed border-[var(--varnarc-border)] px-4 py-8 text-center text-sm text-[var(--varnarc-subtle)]">
        Nothing to preview yet. Generate a draft or write content in the editor.
      </p>
    );
  }

  const raw = looksLikeHtml(content) ? content : markdownToHtml(content);
  const sanitized = sanitizeArticleHtml(raw);
  const { html, items } = extractArticleToc(sanitized);
  const segments = splitArticleWidgets(html);

  return (
    <article
      className={`article-page article-style-${articleStyle} rounded-md border border-[var(--varnarc-border)] bg-white px-4 py-3`}
    >
      {items.length ? (
        <nav className="article-toc" aria-label="On this page">
          <h2>On this page</h2>
          <ol>
            {items
              .filter((item) => item.level === 2)
              .map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>{item.text}</a>
                </li>
              ))}
          </ol>
        </nav>
      ) : null}
      <div className="article-content">
        {segments.map((segment, index) =>
          segment.type === 'widget' ? (
            <div key={`w-${index}`} className="article-block">
              Calculator widget: {segment.widget}
            </div>
          ) : (
            <div key={`h-${index}`} dangerouslySetInnerHTML={{ __html: segment.html }} />
          ),
        )}
      </div>
    </article>
  );
}
