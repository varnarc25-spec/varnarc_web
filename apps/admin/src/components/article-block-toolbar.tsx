'use client';

import { ARTICLE_BLOCKS } from '@/lib/article-blocks';

export function ArticleBlockToolbar({ onInsert }: { onInsert: (html: string) => void }) {
  return (
    <div className="article-block-toolbar" role="toolbar" aria-label="Insert article block">
      <span className="self-center text-xs font-medium text-[var(--varnarc-subtle)]">
        Add block:
      </span>
      {ARTICLE_BLOCKS.map((block) => (
        <button key={block.id} type="button" onClick={() => onInsert(block.html)}>
          {block.label}
        </button>
      ))}
    </div>
  );
}
