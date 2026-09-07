import {
  extractArticleToc,
  looksLikeHtml,
  sanitizeArticleHtml,
  splitArticleWidgets,
} from '@varnarc/validation';
import { ArticleTableOfContents } from '@/components/articles/article-table-of-contents';
import { ArticleWidgetRenderer } from '@/components/articles/article-widget-renderer';
import { MarkdownContent } from '@/components/shared/markdown-content';

export function ArticleBody({ content }: { content: string }) {
  if (!content.trim()) return null;
  if (!looksLikeHtml(content)) {
    return <MarkdownContent content={content} />;
  }

  const sanitized = sanitizeArticleHtml(content);
  const { html, items } = extractArticleToc(sanitized);
  const segments = splitArticleWidgets(html);

  return (
    <div className="article-content">
      <ArticleTableOfContents items={items} />
      {segments.map((segment, index) =>
        segment.type === 'widget' ? (
          <ArticleWidgetRenderer
            key={`widget-${segment.widget}-${index}`}
            widget={segment.widget}
          />
        ) : (
          <div key={`html-${index}`} dangerouslySetInnerHTML={{ __html: segment.html }} />
        ),
      )}
    </div>
  );
}
