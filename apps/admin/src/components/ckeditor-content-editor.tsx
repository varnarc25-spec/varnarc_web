'use client';

import dynamic from 'next/dynamic';
import type { ArticleEditorHandle } from '@/lib/ckeditor-insert';

const Editor = dynamic(
  () =>
    import('@/components/ckeditor-content-editor-client').then(
      (module) => module.CkeditorContentEditorClient,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-80 animate-pulse rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)]" />
    ),
  },
);

export function CkeditorContentEditor({
  value,
  onChange,
  placeholder,
  onReady,
  enableSourceEditing,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onReady?: (editor: ArticleEditorHandle) => void;
  enableSourceEditing?: boolean;
}) {
  return (
    <Editor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onReady={onReady}
      enableSourceEditing={enableSourceEditing}
    />
  );
}
