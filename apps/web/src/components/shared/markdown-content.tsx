import ReactMarkdown from 'react-markdown';
import { AffiliateBlockCard, splitAffiliateBlocks } from '@/components/cms/affiliate-block';

function looksLikeHtml(content: string) {
  return /^\s*</.test(content) || /<(?:p|h[1-6]|ul|ol|blockquote|div|img|iframe)\b/i.test(content);
}

function sanitizeHtml(html: string) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

export function MarkdownContent({ content }: { content: string }) {
  if (looksLikeHtml(content)) {
    const parts = splitAffiliateBlocks(sanitizeHtml(content));
    if (parts.some((part) => part.type === 'affiliate')) {
      return (
        <div className="prose prose-slate max-w-none prose-headings:text-[#0b1f3a] prose-a:text-[#f97316] [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-md">
          {parts.map((part, index) =>
            part.type === 'affiliate' ? (
              <AffiliateBlockCard key={`aff-${index}`} {...(part.value as Parameters<typeof AffiliateBlockCard>[0])} />
            ) : part.value ? (
              <div key={`html-${index}`} dangerouslySetInnerHTML={{ __html: part.value as string }} />
            ) : null,
          )}
        </div>
      );
    }
    return (
      <div
        className="prose prose-slate max-w-none prose-headings:text-[#0b1f3a] prose-a:text-[#f97316] [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-md"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    );
  }

  return (
    <div className="prose prose-slate max-w-none prose-headings:text-[#0b1f3a] prose-a:text-[#f97316]">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
