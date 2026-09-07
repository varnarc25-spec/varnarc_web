'use client';

import { useRef, useState } from 'react';
import { CkeditorContentEditor } from '@/components/ckeditor-content-editor';
import { ArticleContentPreview } from '@/components/article-content-preview';
import { ArticleBlockToolbar } from '@/components/article-block-toolbar';
import { insertEditorHtml, type ArticleEditorHandle } from '@/lib/ckeditor-insert';

export function ArticleContentEditor({
  value,
  onChange,
  articleStyle = 'default',
}: {
  value: string;
  onChange: (html: string) => void;
  articleStyle?: string;
}) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const editorRef = useRef<ArticleEditorHandle | null>(null);

  function insertBlock(html: string) {
    if (editorRef.current) {
      insertEditorHtml(editorRef.current, html);
      return;
    }
    onChange(`${value}${html}`);
  }

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
        <>
          <ArticleBlockToolbar onInsert={insertBlock} />
          <CkeditorContentEditor
            value={value}
            onChange={onChange}
            placeholder="Write the article…"
            enableSourceEditing
            onReady={(editor) => {
              editorRef.current = editor as ArticleEditorHandle;
            }}
          />
        </>
      ) : (
        <ArticleContentPreview content={value} articleStyle={articleStyle} />
      )}
    </div>
  );
}
