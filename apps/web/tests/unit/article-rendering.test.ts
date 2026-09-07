import { describe, expect, it } from 'vitest';
import { extractArticleToc, sanitizeArticleHtml, splitArticleWidgets } from '@varnarc/validation';

describe('public article rendering helpers', () => {
  it('does not treat missing articleType as fatal', () => {
    const html = sanitizeArticleHtml('<p>Legacy article</p><h2>Section</h2>');
    const toc = extractArticleToc(html);
    expect(toc.items[0]?.text).toBe('Section');
  });

  it('maps calculator widgets without crashing on unknown widgets', () => {
    const html = sanitizeArticleHtml(
      '<p>Hi</p><div class="article-widget" data-widget="personal-loan-emi"></div><div class="article-widget" data-widget="nope"></div>',
    );
    const parts = splitArticleWidgets(html);
    expect(parts.some((p) => p.type === 'widget')).toBe(true);
    expect(html).not.toContain('nope');
  });

  it('preserves article classes and strips scripts', () => {
    const html = sanitizeArticleHtml(
      '<div class="article-block article-info-box"><p>Hello</p></div><script>alert(1)</script><a href="javascript:alert(1)">x</a>',
    );
    expect(html).toContain('article-info-box');
    expect(html).not.toContain('script');
    expect(html).not.toContain('javascript:');
  });

  it('rewrites body H1 to H2 and keeps approved widgets', () => {
    const html = sanitizeArticleHtml(
      '<h1>Title</h1><div class="article-widget" data-widget="home-loan-emi"></div>',
    );
    expect(html).toContain('<h2>Title</h2>');
    expect(html).toContain('data-widget="home-loan-emi"');
  });
});
