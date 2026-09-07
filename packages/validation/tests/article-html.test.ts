import { describe, expect, it } from 'vitest';
import {
  extractArticleToc,
  isAllowedArticleWidget,
  sanitizeArticleHtml,
  sanitizeCustomCssClass,
  splitArticleWidgets,
} from '../src/article-html';

describe('sanitizeArticleHtml', () => {
  it('preserves normal markup and article classes', () => {
    const html =
      '<div class="article-block article-info-box"><strong>Good to know</strong><p>Hello</p></div>';
    expect(sanitizeArticleHtml(html)).toContain('article-info-box');
    expect(sanitizeArticleHtml(html)).toContain('<p>Hello</p>');
  });

  it('removes scripts and javascript urls', () => {
    const html =
      '<p>Hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><img src="https://cdn.example/a.jpg" onerror="alert(1)" alt="A" />';
    const out = sanitizeArticleHtml(html);
    expect(out).not.toContain('script');
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('onerror');
    expect(out).toContain('cdn.example/a.jpg');
  });

  it('keeps approved widgets and drops unapproved ones', () => {
    const html =
      '<div class="article-widget" data-widget="personal-loan-emi"></div><div class="article-widget" data-widget="evil-script"></div>';
    const out = sanitizeArticleHtml(html);
    expect(out).toContain('data-widget="personal-loan-emi"');
    expect(out).not.toContain('evil-script');
  });

  it('rewrites body H1 to H2', () => {
    expect(sanitizeArticleHtml('<h1>Title</h1>')).toContain('<h2>Title</h2>');
  });
});

describe('article widgets and toc', () => {
  it('maps allowed widgets', () => {
    expect(isAllowedArticleWidget('home-loan-emi')).toBe(true);
    expect(isAllowedArticleWidget('unknown')).toBe(false);
  });

  it('splits widget placeholders', () => {
    const html =
      '<p>Before</p><div class="article-widget" data-widget="car-loan-emi"></div><p>After</p>';
    const parts = splitArticleWidgets(sanitizeArticleHtml(html));
    expect(parts.some((p) => p.type === 'widget' && p.widget === 'car-loan-emi')).toBe(true);
  });

  it('builds stable toc ids from h2', () => {
    const { items, html } = extractArticleToc('<h2>What Is EMI?</h2><h2>What Is EMI?</h2>');
    expect(items).toHaveLength(2);
    expect(items[0].id).not.toBe(items[1].id);
    expect(html).toContain(`id="${items[0].id}"`);
  });

  it('rejects unsafe custom css classes', () => {
    expect(sanitizeCustomCssClass('personal-loan-emi-special')).toBe('personal-loan-emi-special');
    expect(sanitizeCustomCssClass('bad class')).toBeNull();
    expect(sanitizeCustomCssClass('a{color:red}')).toBeNull();
  });
});
