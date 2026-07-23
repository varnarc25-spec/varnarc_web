export function looksLikeHtml(content: string) {
  return /^\s*</.test(content) || /<(?:p|h[1-6]|ul|ol|blockquote|div|img|iframe)\b/i.test(content);
}

/** Convert AI markdown drafts into HTML for TipTap and preview. */
export function markdownToHtml(markdown: string): string {
  if (!markdown.trim()) return '';
  if (looksLikeHtml(markdown)) return markdown;

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const htmlParts: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    htmlParts.push(`<p>${paragraph.join('<br/>')}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    htmlParts.push(`<ul>${listItems.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      flushParagraph();
      continue;
    }

    if (/^[-*] /.test(trimmed)) {
      flushParagraph();
      listItems.push(trimmed.replace(/^[-*] /, ''));
      continue;
    }

    flushList();

    if (trimmed.startsWith('### ')) {
      flushParagraph();
      htmlParts.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      htmlParts.push(`<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushParagraph();
      htmlParts.push(`<h1>${inlineMarkdown(trimmed.slice(2))}</h1>`);
      continue;
    }

    paragraph.push(inlineMarkdown(trimmed));
  }

  flushList();
  flushParagraph();
  return htmlParts.join('');
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function normalizeArticleContent(content: string): string {
  if (!content.trim()) return '';
  return looksLikeHtml(content) ? content : markdownToHtml(content);
}

export function sanitizePreviewHtml(html: string) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}
