'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@varnarc/ui';

export function AvatarUpload({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null;
  displayName: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function onFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image must be 5 MB or smaller.');
      return;
    }
    setLoading(true);
    setMessage(null);
    setPreview(URL.createObjectURL(file));
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/user/avatar', { method: 'POST', body: form });
      const json = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
        data?: { avatarUrl?: string | null };
      };
      if (!res.ok) throw new Error(json.error?.message || 'Upload failed');
      if (json.data?.avatarUrl) setPreview(json.data.avatarUrl);
      setMessage('Profile photo updated.');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed');
      setPreview(avatarUrl);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--varnarc-muted)] text-lg font-semibold text-[var(--varnarc-ink)]">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          initials || '?'
        )}
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? 'Uploading…' : 'Change photo'}
        </Button>
        {message ? <p className="mt-1 text-xs text-[var(--varnarc-subtle)]">{message}</p> : null}
      </div>
    </div>
  );
}
