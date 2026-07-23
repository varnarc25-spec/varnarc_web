'use client';

import { useCallback, useState } from 'react';
import { Button } from '@varnarc/ui';

export function MediaUploadZone({
  folderId,
  onUploaded,
}: {
  folderId?: string | null;
  onUploaded?: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      setUploading(true);
      setMessage(null);
      let ok = 0;
      let failed = 0;

      for (const file of list) {
        const form = new FormData();
        form.append('file', file);
        if (folderId) form.append('folderId', folderId);
        try {
          const res = await fetch('/api/admin/media/upload', { method: 'POST', body: form });
          if (!res.ok) {
            const json = (await res.json()) as { error?: { message?: string } };
            throw new Error(json.error?.message || 'Upload failed');
          }
          ok += 1;
        } catch {
          failed += 1;
        }
      }

      setMessage(`${ok} uploaded${failed ? `, ${failed} failed` : ''}`);
      setUploading(false);
      onUploaded?.();
    },
    [folderId, onUploaded],
  );

  return (
    <div
      className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        dragging
          ? 'border-[var(--varnarc-brand)] bg-[var(--varnarc-muted)]'
          : 'border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void uploadFiles(e.dataTransfer.files);
      }}
    >
      <p className="mb-2 text-sm font-medium">Drag and drop files here</p>
      <p className="mb-4 text-xs text-[var(--varnarc-subtle)]">
        Images, PDFs, documents, and videos up to 50 MB
      </p>
      <label className="inline-block">
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void uploadFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <span className="inline-flex cursor-pointer">
          <Button type="button" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Choose files'}
          </Button>
        </span>
      </label>
      {message ? <p className="mt-3 text-xs text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
