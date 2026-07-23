'use client';

import { useState } from 'react';
import { RichTextEditor } from '@/components/rich-text-editor';
import { ArticleContentPreview } from '@/components/article-content-preview';

export function ArticleContentEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={`rounded px-3 py-1 text-xs font-medium ${
            mode === 'edit'
              ? 'bg-white text-[var(--varnarc-ink)] shadow-sm'
              : 'text-[var(--varnarc-subtle)] hover:text-[var(--varnarc-ink)]'
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`rounded px-3 py-1 text-xs font-medium ${
            mode === 'preview'
              ? 'bg-white text-[var(--varnarc-ink)] shadow-sm'
              : 'text-[var(--varnarc-subtle)] hover:text-[var(--varnarc-ink)]'
          }`}
        >
          Page preview
        </button>
      </div>
      {mode === 'edit' ? (
        <RichTextEditor value={value} onChange={onChange} />
      ) : (
        <ArticleContentPreview content={value} />
      )}
    </div>
  );
}
