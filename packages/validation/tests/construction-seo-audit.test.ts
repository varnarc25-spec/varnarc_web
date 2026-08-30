import { describe, expect, it } from 'vitest';
import { parseConstructionPageHtml, withRecommendedAction } from '../src/construction-seo-audit';

describe('construction-seo-audit parsers', () => {
  it('extracts title, canonical, h1, and breadcrumb json-ld', () => {
    const html = `<!doctype html><html><head>
      <title>Cement Calculator | Varnarc</title>
      <meta name="description" content="Estimate cement bags for your project." />
      <link rel="canonical" href="https://varnarc.com/construction/cement-calculator" />
      <script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[]}</script>
    </head><body>
      <h1>Cement Calculator</h1>
      <img src="/a.png" />
      <a href="/construction/concrete-calculator">Concrete</a>
    </body></html>`;
    const signals = parseConstructionPageHtml(html);
    expect(signals.title).toContain('Cement Calculator');
    expect(signals.metaDescription).toMatch(/cement/i);
    expect(signals.canonical).toContain('/construction/cement-calculator');
    expect(signals.h1s).toEqual(['Cement Calculator']);
    expect(signals.hasBreadcrumbJsonLd).toBe(true);
    expect(signals.imagesMissingAlt).toBe(1);
    expect(signals.internalLinks).toContain('/construction/concrete-calculator');
  });

  it('attaches recommended actions without rewriting content', () => {
    const issue = withRecommendedAction({
      path: '/construction/x',
      pageType: 'hub',
      issueType: 'missing_title',
      severity: 'CRITICAL',
      message: 'Missing title',
    });
    expect(issue.recommendedAction.toLowerCase()).toContain('meta title');
    expect(issue.recommendedAction.toLowerCase()).toContain('do not auto');
  });
});
