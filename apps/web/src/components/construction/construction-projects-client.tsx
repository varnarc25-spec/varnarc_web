'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';
import type { ConstructionChecklistSummary, ConstructionProject } from '@/services/construction';
import { defaultConstructionTimeline } from '@/services/construction';

const inputClass =
  'h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-[#0b1f3a]';

export function ConstructionProjectsClient({
  projects,
  checklists,
}: {
  projects: ConstructionProject[];
  checklists: ConstructionChecklistSummary[];
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(projects[0]?.id ?? null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { name: string; notes: string }>>(() =>
    Object.fromEntries(projects.map((p) => [p.id, { name: p.name, notes: p.notes ?? '' }])),
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  async function saveProject(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    setMessages((prev) => ({ ...prev, [id]: '' }));
    try {
      const res = await fetch(`/api/construction/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: draft.name.trim(), notes: draft.notes.trim() || undefined }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Update failed');
      setMessages((prev) => ({ ...prev, [id]: 'Saved' }));
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setMessages((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : 'Update failed',
      }));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const expanded = expandedId === project.id;
        const draft = drafts[project.id] ?? { name: project.name, notes: project.notes ?? '' };
        const timeline = defaultConstructionTimeline();
        const checklist = checklists[0];

        return (
          <article key={project.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
              onClick={() => setExpandedId(expanded ? null : project.id)}
            >
              <div>
                <h2 className="text-base font-extrabold text-[#0b1f3a]">{project.name}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {[project.projectType, project.estimatedCost != null ? `₹${project.estimatedCost}` : null]
                    .filter(Boolean)
                    .join(' · ') || 'Construction project'}
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500">{expanded ? 'Hide' : 'Details'}</span>
            </button>

            {expanded ? (
              <div className="space-y-6 border-t border-slate-100 px-5 py-5">
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#0b1f3a]">Project details</h3>
                    {editingId === project.id ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={savingId === project.id}
                          onClick={() => void saveProject(project.id)}
                        >
                          {savingId === project.id ? 'Saving…' : 'Save'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingId(null);
                            setDrafts((prev) => ({
                              ...prev,
                              [project.id]: { name: project.name, notes: project.notes ?? '' },
                            }));
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" size="sm" variant="secondary" onClick={() => setEditingId(project.id)}>
                        Edit name &amp; notes
                      </Button>
                    )}
                  </div>
                  {editingId === project.id ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
                        <input
                          className={inputClass}
                          value={draft.name}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [project.id]: { ...draft, name: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
                        <textarea
                          className={`${inputClass} min-h-24 py-2`}
                          value={draft.notes}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [project.id]: { ...draft, notes: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Type</dt>
                        <dd className="mt-1 text-[#0b1f3a]">{project.projectType || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Area</dt>
                        <dd className="mt-1 text-[#0b1f3a]">
                          {project.areaSqft != null ? `${project.areaSqft} sq ft` : '—'}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</dt>
                        <dd className="mt-1 whitespace-pre-line text-slate-700">{project.notes || '—'}</dd>
                      </div>
                    </dl>
                  )}
                  {messages[project.id] ? (
                    <p className="mt-2 text-sm text-slate-600">{messages[project.id]}</p>
                  ) : null}
                </section>

                <section>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#0b1f3a]">Budget</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <BudgetStat label="Estimated total" value={project.estimatedCost != null ? `₹${project.estimatedCost}` : '—'} />
                    <BudgetStat label="Line items" value={String(project.items?.length ?? 0)} />
                    <BudgetStat label="Region" value={project.region || '—'} />
                    <BudgetStat
                      label="Created"
                      value={project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}
                    />
                  </div>
                  {project.breakdown?.length ? (
                    <ul className="mt-4 space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
                      {project.breakdown.map((row) => (
                        <li key={row.label} className="flex justify-between text-slate-700">
                          <span>{row.label}</span>
                          <span>₹{row.amount}</span>
                        </li>
                      ))}
                    </ul>
                  ) : project.items?.length ? (
                    <ul className="mt-4 space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
                      {project.items.map((item) => (
                        <li key={item.id} className="flex justify-between text-slate-700">
                          <span>{item.name || item.material?.name || 'Item'}</span>
                          <span>{item.estimatedCost != null ? `₹${item.estimatedCost}` : '—'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>

                <section>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#0b1f3a]">Timeline</h3>
                    <Link href="/construction/planner" className="text-sm font-medium text-[#f97316] hover:underline">
                      Open planner
                    </Link>
                  </div>
                  <ol className="mt-3 space-y-3">
                    {timeline.map((phase, index) => (
                      <li key={phase.label} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0b1f3a] text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#0b1f3a]">{phase.label}</p>
                          {phase.description ? <p className="mt-1 text-xs text-slate-600">{phase.description}</p> : null}
                          {phase.durationWeeks ? (
                            <p className="mt-1 text-xs font-medium text-slate-500">{phase.durationWeeks} weeks</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                <section>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#0b1f3a]">Checklist</h3>
                    {checklist ? (
                      <Link
                        href={`/construction/checklists/${checklist.slug}`}
                        className="text-sm font-medium text-[#f97316] hover:underline"
                      >
                        View full checklist
                      </Link>
                    ) : (
                      <Link href="/construction/checklists" className="text-sm font-medium text-[#f97316] hover:underline">
                        Browse checklists
                      </Link>
                    )}
                  </div>
                  {checklist ? (
                    <p className="mt-2 text-sm text-slate-600">
                      Start with <span className="font-medium text-[#0b1f3a]">{checklist.title}</span>
                      {checklist.itemCount ? ` (${checklist.itemCount} items)` : ''}.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">
                      Browse construction checklists for material and milestone tracking.
                    </p>
                  )}
                </section>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function BudgetStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-[#0b1f3a]">{value}</div>
    </div>
  );
}
