/** Rule-based SEO fallback when AI is not configured. */
export function generateLocalSeo(input: {
  title: string;
  excerpt?: string;
  content?: string;
}): { title: string; description: string; metaKeywords: string } {
  const title = input.title.trim();
  const plain = stripHtml(input.content || '').replace(/\s+/g, ' ').trim();
  const excerpt = (input.excerpt || '').trim();
  const source = excerpt || plain;

  const description = truncate(
    source ||
      `Read ${title} on Varnarc — practical guides for finance, loans, and everyday decisions in India.`,
    155,
  );

  const seoTitle = truncate(title.includes('|') ? title : `${title} | Varnarc`, 60);

  const words = `${title} ${source}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const stop = new Set([
    'with',
    'from',
    'that',
    'this',
    'your',
    'have',
    'will',
    'about',
    'into',
    'their',
    'they',
    'what',
    'when',
    'where',
    'which',
    'guide',
    'article',
  ]);

  const keywords = [...new Set(words.filter((w) => !stop.has(w)))].slice(0, 8).join(', ');

  return {
    title: seoTitle,
    description,
    metaKeywords: keywords || 'finance, india, guide',
  };
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}
