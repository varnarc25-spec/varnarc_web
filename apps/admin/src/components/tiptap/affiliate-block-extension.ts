import { Node } from '@tiptap/core';
import type { Editor } from '@tiptap/react';

export type AffiliateBlockAttrs = {
  label: string;
  url: string;
  disclosure: string;
  sponsored: boolean;
};

export const AffiliateBlockExtension = Node.create({
  name: 'affiliateBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      label: { default: 'Apply now' },
      url: { default: '' },
      disclosure: { default: 'Affiliate link — we may earn a commission.' },
      sponsored: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-affiliate-block="true"]' }];
  },

  renderHTML({ node }) {
    const { label, url, disclosure, sponsored } = node.attrs as AffiliateBlockAttrs;
    return [
      'div',
      {
        'data-affiliate-block': 'true',
        'data-label': label,
        'data-url': url,
        'data-disclosure': disclosure,
        'data-sponsored': sponsored ? 'true' : 'false',
        class:
          'affiliate-block my-4 rounded border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900',
      },
      `${label} → ${url}`,
    ];
  },
});

export function insertAffiliateBlock(editor: Editor) {
  const label = window.prompt('Button label', 'Apply now')?.trim();
  if (!label) return;
  const url = window.prompt('Affiliate URL', 'https://')?.trim();
  if (!url) return;
  const disclosure =
    window.prompt('Disclosure text', 'Affiliate link — we may earn a commission.')?.trim() ||
    'Affiliate link — we may earn a commission.';
  const sponsored = window.confirm('Mark as sponsored placement?');
  editor
    .chain()
    .focus()
    .insertContent({
      type: 'affiliateBlock',
      attrs: { label, url, disclosure, sponsored },
    })
    .run();
}
