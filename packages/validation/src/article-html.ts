export const ARTICLE_TYPES = [
  'GENERAL',
  'GUIDE',
  'CALCULATOR_GUIDE',
  'COMPARISON',
  'HOW_TO',
  'RATES',
  'ELIGIBILITY',
  'NEWS',
] as const;

export type ArticleType = (typeof ARTICLE_TYPES)[number];

export const ARTICLE_STYLES = [
  'default',
  'finance-guide',
  'calculator-guide',
  'comparison',
  'automobile-guide',
  'construction-guide',
] as const;

export type ArticleStyle = (typeof ARTICLE_STYLES)[number];

export const ALLOWED_ARTICLE_WIDGETS = [
  'personal-loan-emi',
  'home-loan-emi',
  'car-loan-emi',
  'loan-eligibility',
] as const;

export type ArticleWidgetId = (typeof ALLOWED_ARTICLE_WIDGETS)[number];

const ALLOWED_WIDGET_SET = new Set<string>(ALLOWED_ARTICLE_WIDGETS);

const ALLOWED_TAGS = new Set([
  'p',
  'h2',
  'h3',
  'h4',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'figure',
  'figcaption',
  'img',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'div',
  'span',
  'sup',
  'sub',
  'details',
  'summary',
  'hr',
  'br',
  'code',
  'pre',
  'iframe',
]);

const VOID_TAGS = new Set(['img', 'br', 'hr']);

const TRUSTED_IFRAME_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
];

export function isAllowedArticleWidget(id: string): id is ArticleWidgetId {
  return ALLOWED_WIDGET_SET.has(id);
}

export function normalizeArticleStyle(value: unknown): ArticleStyle {
  return ARTICLE_STYLES.includes(value as ArticleStyle) ? (value as ArticleStyle) : 'default';
}

export function normalizeArticleType(value: unknown): ArticleType {
  return ARTICLE_TYPES.includes(value as ArticleType) ? (value as ArticleType) : 'GENERAL';
}

export function sanitizeCustomCssClass(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (!/^[a-z][a-z0-9-]{0,78}$/.test(trimmed) || trimmed.includes('--')) return null;
  return trimmed;
}

export function looksLikeHtml(content: string) {
  return (
    /^\s*</.test(content) || /<(?:p|h[1-6]|ul|ol|blockquote|div|img|iframe|table)\b/i.test(content)
  );
}

function isAllowedClass(token: string) {
  return /^(article-[a-z0-9-]+|ck-[a-z0-9-]+|image|image-[a-z0-9-]+|table|media|figure)$/i.test(
    token,
  );
}

function sanitizeClassAttr(value: string) {
  return value.split(/\s+/).filter(isAllowedClass).join(' ');
}

function isSafeUrl(value: string, kind: 'href' | 'src') {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (
    /^\s*javascript:/i.test(trimmed) ||
    /^\s*data:/i.test(trimmed) ||
    /^\s*vbscript:/i.test(trimmed)
  ) {
    return false;
  }
  if (kind === 'href') {
    return /^(https?:|mailto:|tel:|\/|#)/i.test(trimmed);
  }
  return /^(https?:|\/)/i.test(trimmed);
}

function trustedIframeSrc(src: string) {
  try {
    const url = new URL(src, 'https://varnarc.com');
    return TRUSTED_IFRAME_HOSTS.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function decodeAttr(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function encodeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function sanitizeAttributes(tag: string, rawAttrs: string) {
  const attrs: string[] = [];
  const re = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match: RegExpExecArray | null;
  let widget: string | null = null;
  while ((match = re.exec(rawAttrs))) {
    const name = match[1]?.toLowerCase();
    if (!name) continue;
    if (name.startsWith('on') || name === 'style') continue;
    const value = decodeAttr(match[2] ?? match[3] ?? match[4] ?? '');
    if (name === 'href' && tag === 'a' && isSafeUrl(value, 'href')) {
      attrs.push(`href="${encodeAttr(value)}"`);
      if (/^https?:/i.test(value)) {
        attrs.push('rel="noopener noreferrer"');
        attrs.push('target="_blank"');
      }
      continue;
    }
    if (name === 'src' && (tag === 'img' || tag === 'iframe') && isSafeUrl(value, 'src')) {
      if (tag === 'iframe' && !trustedIframeSrc(value)) continue;
      attrs.push(`src="${encodeAttr(value)}"`);
      continue;
    }
    if (name === 'alt' && tag === 'img') {
      attrs.push(`alt="${encodeAttr(value)}"`);
      continue;
    }
    if (
      (name === 'width' || name === 'height') &&
      /^(img|iframe|th|td)$/.test(tag) &&
      /^\d+%?$/.test(value)
    ) {
      attrs.push(`${name}="${encodeAttr(value)}"`);
      continue;
    }
    if (name === 'class') {
      const classes = sanitizeClassAttr(value);
      if (classes) attrs.push(`class="${encodeAttr(classes)}"`);
      continue;
    }
    if (name === 'id' && /^[a-zA-Z][\w:-]{0,80}$/.test(value)) {
      attrs.push(`id="${encodeAttr(value)}"`);
      continue;
    }
    if (name === 'data-widget' && tag === 'div' && isAllowedArticleWidget(value)) {
      widget = value;
      attrs.push(`data-widget="${encodeAttr(value)}"`);
      continue;
    }
    if (name === 'colspan' || name === 'rowspan') {
      if (/^\d{1,2}$/.test(value)) attrs.push(`${name}="${encodeAttr(value)}"`);
      continue;
    }
    if (name === 'open' && tag === 'details') {
      attrs.push('open');
    }
  }
  if (tag === 'div' && rawAttrs.includes('data-widget') && !widget) {
    return { attrs: [], dropTag: true };
  }
  return { attrs, dropTag: false };
}

function rewriteHeading(tag: string) {
  if (tag === 'h1') return 'h2';
  return tag;
}

export function sanitizeArticleHtml(input: string): string {
  if (!input) return '';
  let html = input
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  html = html.replace(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g, (full, slash, rawTag, rawAttrs) => {
    const tag = rewriteHeading(rawTag.toLowerCase());
    if (slash) {
      if (!ALLOWED_TAGS.has(tag)) return '';
      return `</${tag}>`;
    }
    if (!ALLOWED_TAGS.has(tag)) return '';
    const { attrs, dropTag } = sanitizeAttributes(tag, rawAttrs || '');
    if (dropTag) return '';
    const attrStr = attrs.length ? ` ${attrs.join(' ')}` : '';
    if (VOID_TAGS.has(tag) || /\/\s*$/.test(rawAttrs || '')) {
      return `<${tag}${attrStr} />`;
    }
    return `<${tag}${attrStr}>`;
  });

  html = wrapTables(html);
  return html;
}

function wrapTables(html: string) {
  if (!html.includes('<table')) return html;
  return html.replace(/<table\b[\s\S]*?<\/table>/gi, (table) => {
    if (html.includes('article-table-wrap') && table.includes('article-table-wrap')) return table;
    return `<div class="article-table-wrap">${table}</div>`;
  });
}

export type ArticleTocItem = { id: string; text: string; level: 2 | 3 };

export function slugifyHeading(text: string, used: Set<string>) {
  const base =
    text
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80) || 'section';
  let id = base;
  let i = 2;
  while (used.has(id)) {
    id = `${base}-${i}`;
    i += 1;
  }
  used.add(id);
  return id;
}

export function extractArticleToc(html: string): { html: string; items: ArticleTocItem[] } {
  const used = new Set<string>();
  const items: ArticleTocItem[] = [];
  const next = html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/h[23]>/gi, (_full, tag, attrs, inner) => {
    const level = tag.toLowerCase() === 'h2' ? 2 : 3;
    const text = inner.replace(/<[^>]+>/g, '').trim();
    if (!text) return `<${tag}${attrs}>${inner}</${tag}>`;
    const existing = /\sid="([^"]+)"/i.exec(attrs);
    const id = existing?.[1] && !used.has(existing[1]) ? existing[1] : slugifyHeading(text, used);
    if (existing?.[1]) used.add(existing[1]);
    const withoutId = String(attrs)
      .replace(/\sids?="[^"]*"/gi, '')
      .replace(/\sid='[^']*'/gi, '');
    items.push({ id, text, level: level as 2 | 3 });
    return `<${tag}${withoutId} id="${id}">${inner}</${tag}>`;
  });
  return { html: next, items };
}

export function parseFaqItemsFromHtml(html: string): Array<{ question: string; answer: string }> {
  const items: Array<{ question: string; answer: string }> = [];
  const faqBlocks = html.match(/<div[^>]*class="[^"]*article-faq[^"]*"[\s\S]*?<\/div>/gi) || [];
  for (const block of faqBlocks) {
    const details = block.matchAll(
      /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi,
    );
    for (const match of details) {
      const question = (match[1] ?? '').replace(/<[^>]+>/g, '').trim();
      const answer = (match[2] ?? '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (question && answer) items.push({ question, answer });
    }
  }
  return items;
}

export type ArticleHtmlSegment =
  { type: 'html'; html: string } | { type: 'widget'; widget: ArticleWidgetId };

export function splitArticleWidgets(html: string): ArticleHtmlSegment[] {
  const parts: ArticleHtmlSegment[] = [];
  const re =
    /<div[^>]*class="[^"]*article-widget[^"]*"[^>]*data-widget="([^"]+)"[^>]*><\/div>|<div[^>]*data-widget="([^"]+)"[^>]*class="[^"]*article-widget[^"]*"[^>]*><\/div>/gi;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    if (match.index > last) {
      parts.push({ type: 'html', html: html.slice(last, match.index) });
    }
    const widget = match[1] || match[2];
    if (widget && isAllowedArticleWidget(widget)) {
      parts.push({ type: 'widget', widget });
    }
    last = match.index + match[0].length;
  }
  if (last < html.length) parts.push({ type: 'html', html: html.slice(last) });
  return parts.filter((part) => part.type !== 'html' || part.html.trim());
}

export function estimateReadingMinutes(html: string) {
  const words = html
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function articleQualityHints(
  html: string,
  title: string,
  seoTitle: string,
  metaDescription: string,
) {
  const text = html.replace(/<[^>]+>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const h2Count = (html.match(/<h2\b/gi) || []).length;
  const internalLinks = (html.match(/href="\/[^"]+"/gi) || []).length;
  const externalLinks = (html.match(/href="https?:\/\/[^"]+"/gi) || []).length;
  const imagesMissingAlt = (html.match(/<img\b(?![^>]*\balt=)[^>]*>/gi) || []).length;
  return {
    titleLength: title.trim().length,
    seoTitleLength: seoTitle.trim().length,
    metaDescriptionLength: metaDescription.trim().length,
    wordCount: words,
    readingMinutes: estimateReadingMinutes(html),
    h2Count,
    internalLinks,
    externalLinks,
    imagesMissingAlt,
  };
}
