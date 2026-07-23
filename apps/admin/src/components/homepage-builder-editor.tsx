'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle } from '@varnarc/ui';

type WidgetCatalogItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

type CategoryOption = {
  id: string;
  name: string;
  slug?: string;
};

type SectionDraft = {
  clientId: string;
  name: string;
  sortOrder: number;
  widgetId: string;
  widgetSlug: string;
  settings: Record<string, unknown>;
};

type LayoutDetail = {
  id: string;
  name: string;
  slug: string;
  status: string;
  isDefault: boolean;
  sections: Array<{
    id: string;
    name: string;
    sortOrder: number;
    settings: unknown;
    widgetInstances: Array<{
      id: string;
      sortOrder: number;
      settings: unknown;
      widget: { id: string; slug: string; name: string };
    }>;
  }>;
};

function newClientId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `section-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toDrafts(layout: LayoutDetail): SectionDraft[] {
  return [...layout.sections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((section, index) => {
      const widget = [...section.widgetInstances].sort((a, b) => a.sortOrder - b.sortOrder)[0];
      return {
        clientId: section.id || newClientId(),
        name: section.name,
        sortOrder: index,
        widgetId: widget?.widget.id ?? '',
        widgetSlug: widget?.widget.slug ?? '',
        settings: (widget?.settings as Record<string, unknown>) ?? {},
      };
    });
}

function reorderSections(sections: SectionDraft[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return sections;
  const next = [...sections];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return sections;
  next.splice(toIndex, 0, moved);
  return next.map((section, sortOrder) => ({ ...section, sortOrder }));
}

export function HomepageBuilderEditor({
  layout,
  widgets,
  categories = [],
}: {
  layout: LayoutDetail;
  widgets: WidgetCatalogItem[];
  categories?: CategoryOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState(layout.name);
  const [slug, setSlug] = useState(layout.slug);
  const [isDefault, setIsDefault] = useState(layout.isDefault);
  const [sections, setSections] = useState<SectionDraft[]>(() => toDrafts(layout));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const widgetById = useMemo(() => new Map(widgets.map((w) => [w.id, w])), [widgets]);

  function addSection() {
    const first = widgets[0];
    if (!first) return;
    setSections((prev) => [
      ...prev,
      {
        clientId: newClientId(),
        name: `Section ${prev.length + 1}`,
        sortOrder: prev.length,
        widgetId: first.id,
        widgetSlug: first.slug,
        settings: {},
      },
    ]);
  }

  function updateSection(index: number, patch: Partial<SectionDraft>) {
    setSections((prev) =>
      prev.map((section, i) => {
        if (i !== index) return section;
        const next = { ...section, ...patch };
        if (patch.widgetId) {
          const widget = widgetById.get(patch.widgetId);
          next.widgetSlug = widget?.slug ?? '';
        }
        return next;
      }),
    );
  }

  function removeSection(index: number) {
    setSections((prev) =>
      prev.filter((_, i) => i !== index).map((section, sortOrder) => ({ ...section, sortOrder })),
    );
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null) return;
    setSections((prev) => reorderSections(prev, dragIndex, targetIndex));
    setDragIndex(null);
    setDropIndex(null);
  }

  async function save() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        isDefault,
        sections: sections.map((section, sortOrder) => ({
          name: section.name,
          sortOrder,
          settings: null,
          widgets: [
            {
              widgetId: section.widgetId,
              sortOrder: 0,
              settings: Object.keys(section.settings).length ? section.settings : null,
            },
          ],
        })),
      };
      const res = await fetch(`/api/admin/homepage/${layout.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      if (!res.ok) {
        setError(json.error?.message || 'Failed to save layout');
        return;
      }
      setMessage('Layout saved.');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/homepage/${layout.id}/publish`, { method: 'POST' });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        setError(json.error?.message || 'Failed to publish');
        return;
      }
      setMessage('Layout published.');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Layout settings</CardTitle>
              <CardDescription>
                Status: <Badge>{layout.status}</Badge>
                {layout.isDefault ? <Badge className="ml-2">Default</Badge> : null}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={save} disabled={busy}>
                Save
              </Button>
              {layout.status !== 'PUBLISHED' ? (
                <Button onClick={publish} disabled={busy}>
                  Publish
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <div className="grid gap-4 px-6 pb-6 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="font-medium">Name</span>
            <input
              className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Slug</span>
            <input
              className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            Set as default homepage
          </label>
        </div>
        {message ? <p className="px-6 pb-4 text-sm text-green-700">{message}</p> : null}
        {error ? <p className="px-6 pb-4 text-sm text-red-600">{error}</p> : null}
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Sections</h2>
            <p className="text-sm text-[var(--varnarc-subtle)]">Drag sections to reorder.</p>
          </div>
          <Button variant="secondary" onClick={addSection} disabled={!widgets.length}>
            Add section
          </Button>
        </div>

        {sections.map((section, index) => (
          <Card
            key={section.clientId}
            className={
              dropIndex === index
                ? 'ring-2 ring-[var(--varnarc-brand)] ring-offset-2'
                : dragIndex === index
                  ? 'opacity-60'
                  : undefined
            }
            onDragOver={(e) => {
              e.preventDefault();
              setDropIndex(index);
            }}
            onDragLeave={() => setDropIndex((current) => (current === index ? null : current))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(index);
            }}
          >
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setDropIndex(null);
                    }}
                    className="cursor-grab rounded border border-[var(--varnarc-border)] px-2 py-1 text-xs text-[var(--varnarc-subtle)] active:cursor-grabbing"
                    aria-label={`Drag section ${index + 1}`}
                  >
                    ⋮⋮
                  </button>
                  <CardTitle className="text-base">Section {index + 1}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeSection(index)}>
                  Remove
                </Button>
              </div>
            </CardHeader>
            <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium">Section title</span>
                <input
                  className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2"
                  value={section.name}
                  onChange={(e) => updateSection(index, { name: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Widget</span>
                <select
                  className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2"
                  value={section.widgetId}
                  onChange={(e) => updateSection(index, { widgetId: e.target.value })}
                >
                  {widgets.map((widget) => (
                    <option key={widget.id} value={widget.id}>
                      {widget.name}
                    </option>
                  ))}
                </select>
              </label>

              {section.widgetSlug === 'articles' ? (
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium">Article source</span>
                  <select
                    className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2"
                    value={(section.settings.source as string) || 'latest'}
                    onChange={(e) =>
                      updateSection(index, {
                        settings: { ...section.settings, source: e.target.value },
                      })
                    }
                  >
                    <option value="latest">Latest</option>
                    <option value="featured">Featured</option>
                    <option value="category">Category</option>
                  </select>
                </label>
              ) : null}

              {section.widgetSlug === 'articles' && section.settings.source === 'category' ? (
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium">Category</span>
                  <select
                    className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2"
                    value={(section.settings.categoryId as string) || ''}
                    onChange={(e) =>
                      updateSection(index, {
                        settings: { ...section.settings, categoryId: e.target.value },
                      })
                    }
                  >
                    <option value="">Select a category…</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {!categories.length ? (
                    <p className="mt-1 text-xs text-[var(--varnarc-subtle)]">
                      No categories found. Create categories under CMS first.
                    </p>
                  ) : null}
                </label>
              ) : null}

              {section.widgetSlug === 'trending' ? (
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium">Keyword limit</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2"
                    value={Number(section.settings.limit ?? 8)}
                    onChange={(e) =>
                      updateSection(index, {
                        settings: { ...section.settings, limit: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              ) : null}
            </div>
          </Card>
        ))}

        {!sections.length ? (
          <p className="text-sm text-[var(--varnarc-subtle)]">
            No sections yet. Add a section or save the seeded default layout from the database seed.
          </p>
        ) : null}
      </div>
    </div>
  );
}
