'use client';

import { MediaPicker, type MediaPickerSelection } from '@/components/media-picker';

export type EntityMediaValue = {
  mediaId: string | null;
  url: string | null;
  alt: string;
  title?: string;
  caption?: string;
};

/**
 * Media library field for finance/CMS entities.
 * Stores media id + public URL (+ optional editorial alt/title/caption).
 * Does not include AI generation — use ArticleFeaturedImageField when AI is allowed.
 */
export function EntityMediaField({
  label,
  help,
  value,
  onChange,
  showCaption = false,
  showTitle = false,
}: {
  label: string;
  help?: string;
  value: EntityMediaValue;
  onChange: (next: EntityMediaValue) => void;
  showCaption?: boolean;
  showTitle?: boolean;
}) {
  function applySelection(selection: MediaPickerSelection) {
    onChange({
      mediaId: selection.id,
      url: selection.url,
      alt: selection.alt?.trim() || value.alt || '',
      title: selection.title?.trim() || value.title || '',
      caption: selection.caption?.trim() || value.caption || '',
    });
  }

  return (
    <div className="space-y-2 rounded-lg border border-[var(--varnarc-border)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--varnarc-ink)]">{label}</span>
      </div>
      <MediaPicker
        value={value.mediaId}
        previewUrl={value.url}
        label={label}
        onChange={(id, url) =>
          onChange({
            ...value,
            mediaId: id,
            url: url ?? null,
          })
        }
        onSelect={applySelection}
      />
      <label className="block text-xs text-[var(--varnarc-subtle)]">
        Alt text
        <input
          className="mt-1 h-9 w-full rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          value={value.alt}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
          placeholder="Describe the image for accessibility"
          maxLength={300}
        />
      </label>
      {showTitle ? (
        <label className="block text-xs text-[var(--varnarc-subtle)]">
          Image title
          <input
            className="mt-1 h-9 w-full rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
            value={value.title ?? ''}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="Optional title attribute"
            maxLength={200}
          />
        </label>
      ) : null}
      {showCaption ? (
        <label className="block text-xs text-[varnarc-subtle)]">
          Caption
          <input
            className="mt-1 h-9 w-full rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
            value={value.caption ?? ''}
            onChange={(e) => onChange({ ...value, caption: e.target.value })}
            placeholder="Optional caption"
            maxLength={500}
          />
        </label>
      ) : null}
      {help ? <p className="text-xs text-[var(--varnarc-subtle)]">{help}</p> : null}
    </div>
  );
}
