'use client';

import dynamic from 'next/dynamic';

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
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  return <Editor value={value} onChange={onChange} />;
}
