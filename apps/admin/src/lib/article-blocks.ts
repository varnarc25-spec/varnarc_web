export type ArticleBlockDef = {
  id: string;
  label: string;
  html: string;
};

export const ARTICLE_BLOCKS: ArticleBlockDef[] = [
  {
    id: 'key-takeaways',
    label: 'Key Takeaways',
    html: `<div class="article-block article-key-takeaways"><h3>Key Takeaways</h3><ul><li>Add your first takeaway here.</li><li>Add another important point.</li><li>Add another useful point.</li></ul></div>`,
  },
  {
    id: 'info',
    label: 'Info',
    html: `<div class="article-block article-info-box"><strong>Good to know</strong><p>Add helpful information here.</p></div>`,
  },
  {
    id: 'warning',
    label: 'Warning',
    html: `<div class="article-block article-warning-box"><strong>Important</strong><p>Add an important warning here.</p></div>`,
  },
  {
    id: 'tip',
    label: 'Tip',
    html: `<div class="article-block article-tip-box"><strong>Tip</strong><p>Add a practical tip here.</p></div>`,
  },
  {
    id: 'formula',
    label: 'Formula',
    html: `<div class="article-block article-formula-card"><h3>Formula</h3><div class="article-formula-equation">Add formula here</div><p>Add variable explanation here.</p></div>`,
  },
  {
    id: 'cta',
    label: 'CTA',
    html: `<div class="article-block article-cta"><span class="article-cta-label">TRY THE TOOL</span><h3>Calculate Your EMI</h3><p>Compare repayment scenarios before making a decision.</p><a href="/finance/calculators/personal-loan-emi">Open Calculator</a></div>`,
  },
  {
    id: 'calculator',
    label: 'Calculator',
    html: `<div class="article-widget article-block" data-widget="personal-loan-emi"></div>`,
  },
  {
    id: 'faq',
    label: 'FAQ',
    html: `<div class="article-block article-faq"><h3>Frequently asked questions</h3><details><summary>Add a question here?</summary><p>Add a concise answer here.</p></details><details><summary>Add another question?</summary><p>Add another concise answer here.</p></details></div>`,
  },
  {
    id: 'comparison',
    label: 'Comparison',
    html: `<div class="article-comparison-grid"><div class="article-comparison-card"><h3>Option A</h3><p>Add a short description.</p><p><strong>Pros</strong></p><ul><li>Add a benefit.</li></ul><p><strong>Limitations</strong></p><ul><li>Add a limitation.</li></ul></div><div class="article-comparison-card"><h3>Option B</h3><p>Add a short description.</p><p><strong>Pros</strong></p><ul><li>Add a benefit.</li></ul><p><strong>Limitations</strong></p><ul><li>Add a limitation.</li></ul></div></div>`,
  },
  {
    id: 'pros-cons',
    label: 'Pros / Cons',
    html: `<div class="article-block article-pros-cons"><h3>Pros and cons</h3><div class="article-comparison-grid"><div><h4>Pros</h4><ul><li>Add a benefit.</li></ul></div><div><h4>Cons</h4><ul><li>Add a limitation.</li></ul></div></div></div>`,
  },
  {
    id: 'checklist',
    label: 'Checklist',
    html: `<div class="article-block article-checklist"><ul><li>Add checklist item.</li><li>Add checklist item.</li></ul></div>`,
  },
  {
    id: 'image-caption',
    label: 'Image + Caption',
    html: `<figure class="article-block"><img src="" alt="Describe the image" width="1200" height="675" /><figcaption>Add a caption.</figcaption></figure>`,
  },
  {
    id: 'related-tool',
    label: 'Related Tool',
    html: `<div class="article-block article-related-tool"><span class="article-cta-label">RELATED TOOL</span><h3>Open a related calculator</h3><p>Help readers apply this guide immediately.</p><a href="/finance/calculators">Browse calculators</a></div>`,
  },
  {
    id: 'source',
    label: 'Source note',
    html: `<div class="article-block article-source-note"><strong>Source / verification</strong><p>Add the source or last-verified date here.</p></div>`,
  },
];
