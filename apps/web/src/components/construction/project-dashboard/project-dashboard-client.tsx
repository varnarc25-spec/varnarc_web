'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { cn, cx } from '@/components/construction/styles';
import type { ConstructionProject, ConstructionSupplier } from '@/services/construction';
import {
  PROJECT_DASHBOARD_TABS,
  actualSpentFromProject,
  budgetTotalFromProject,
  currentPhaseName,
  estimateBreakdownRows,
  expectedCompletionDate,
  formatDate,
  formatInr,
  isProjectDashboardTab,
  materialCostFromProject,
  nextRecommendedAction,
  projectProgressPct,
  recentActivity,
  toNum,
  wizardMeta,
  type ProjectDashboardTabId,
} from './dashboard-metrics';

function EmptyBlock({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-[#0b1f3a]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{body}</p>
      {action ? (
        <Link href={action.href} className={cn(cx.primaryBtn, 'mt-4 inline-flex')}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string | null;
}) {
  const missing = value === '—' || value === 'Not available';
  return (
    <article className={cn(cx.card, 'p-4')}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-1 text-lg font-bold tabular-nums',
          missing ? 'text-slate-400' : 'text-[#0b1f3a]',
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}

export function ProjectDashboardClient({
  project,
  suppliers = [],
}: {
  project: ConstructionProject;
  suppliers?: ConstructionSupplier[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: ProjectDashboardTabId = isProjectDashboardTab(tabParam) ? tabParam : 'overview';

  function setTab(tab: ProjectDashboardTabId) {
    const next = new URLSearchParams(searchParams.toString());
    if (tab === 'overview') next.delete('tab');
    else next.set('tab', tab);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const meta = wizardMeta(project);
  const estimated = toNum(project.estimatedCost);
  const spent = actualSpentFromProject(project);
  const budgetTotal = budgetTotalFromProject(project);
  const variance = budgetTotal != null && spent != null ? budgetTotal - spent : null;
  const progress = projectProgressPct(project);
  const completion = expectedCompletionDate(project);
  const materialCost = materialCostFromProject(project);
  const phaseName = currentPhaseName(project);
  const estimateRows = estimateBreakdownRows(project);
  const recommended = nextRecommendedAction(project);
  const activity = recentActivity(project);
  const quoteDocs = useMemo(
    () => (project.documents ?? []).filter((d) => d.kind === 'QUOTE'),
    [project.documents],
  );
  const otherDocs = useMemo(
    () => (project.documents ?? []).filter((d) => d.kind !== 'QUOTE'),
    [project.documents],
  );

  const area = toNum(project.areaSqft);

  return (
    <div className="space-y-5">
      <header className={cn(cx.card, 'p-4 sm:p-5')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Construction project
            </p>
            <h2 className="mt-1 truncate text-xl font-bold text-[#0b1f3a]">{project.name}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {[
                project.region,
                project.projectType,
                project.quality,
                project.status,
                area != null ? `${area.toLocaleString('en-IN')} sq ft` : null,
                meta?.floors != null ? `${meta.floors} floors` : null,
                meta?.buildMode === 'renovation'
                  ? 'Renovation'
                  : meta?.buildMode === 'new'
                    ? 'New build'
                    : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <Link href="/construction/projects" className={cx.secondaryBtn}>
            All projects
          </Link>
        </div>
      </header>

      <nav
        aria-label="Project sections"
        className="sticky top-0 z-20 -mx-1 border-b border-slate-200 bg-white/95 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/80"
      >
        <div className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PROJECT_DASHBOARD_TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition',
                  cx.touch,
                  active
                    ? 'bg-[#0b1f3a] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {activeTab === 'overview' ? (
        <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Estimated cost"
              value={estimated != null ? formatInr(estimated) : '—'}
              hint={estimated != null ? 'Saved project estimate' : 'No estimate saved yet'}
            />
            <MetricCard
              label="Actual spent"
              value={spent != null ? formatInr(spent) : '—'}
              hint={spent != null ? 'Sum of recorded expenses' : 'No expenses recorded'}
            />
            <MetricCard
              label="Budget variance"
              value={variance != null ? `${variance >= 0 ? '+' : ''}${formatInr(variance)}` : '—'}
              hint={
                variance != null
                  ? 'Budget total minus actual spent'
                  : 'Needs both budget and expenses'
              }
            />
            <MetricCard
              label="Project progress"
              value={progress != null ? `${progress}%` : '—'}
              hint={
                progress != null ? 'Based on completed phases' : 'No timeline phases to measure'
              }
            />
            <MetricCard
              label="Expected completion"
              value={completion ?? '—'}
              hint={
                completion
                  ? project.targetEndAt
                    ? 'From project target date'
                    : 'From phase planned end dates'
                  : 'No completion date set'
              }
            />
            <MetricCard
              label="Material cost"
              value={materialCost != null ? formatInr(materialCost) : '—'}
              hint={
                materialCost != null
                  ? 'From estimate or material line items'
                  : 'No material cost data yet'
              }
            />
            <MetricCard
              label="Current construction phase"
              value={phaseName ?? '—'}
              hint={phaseName ? 'From project timeline' : 'No phases defined for this project'}
            />
            <MetricCard
              label="Budget total"
              value={budgetTotal != null ? formatInr(budgetTotal) : '—'}
              hint={
                budgetTotal != null
                  ? (project.budgetItems?.length ?? 0) > 0
                    ? 'Sum of budget lines'
                    : 'From project setup budget'
                  : 'No budget set'
              }
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className={cn(cx.card, 'border-l-4 border-l-[#f97316] p-5')}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Next recommended action
              </p>
              <h3 className="mt-2 text-lg font-bold text-[#0b1f3a]">{recommended.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{recommended.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={recommended.href} className={cx.primaryBtn}>
                  {recommended.title}
                </Link>
                {recommended.tab ? (
                  <button
                    type="button"
                    className={cx.secondaryBtn}
                    onClick={() => setTab(recommended.tab!)}
                  >
                    Open {recommended.tab} tab
                  </button>
                ) : null}
              </div>
            </article>

            <article className={cn(cx.card, 'p-5')}>
              <h3 className="text-sm font-bold text-[#0b1f3a]">Recent activity</h3>
              {activity.length ? (
                <ul className="mt-3 space-y-2">
                  {activity.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 text-sm last:border-0"
                    >
                      <span className="text-slate-700">{item.label}</span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {formatDate(item.at) ?? ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No activity recorded yet.</p>
              )}
            </article>
          </section>
        </div>
      ) : null}

      {activeTab === 'estimate' ? (
        <section className="space-y-4">
          <div className={cn(cx.card, 'p-5')}>
            <h3 className="text-sm font-bold text-[#0b1f3a]">Cost estimate</h3>
            {estimated != null ? (
              <p className="mt-2 text-2xl font-bold tabular-nums text-[#0b1f3a]">
                {formatInr(estimated)}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No estimated cost saved on this project.
              </p>
            )}
            {estimateRows.length ? (
              <ul className="mt-4 divide-y divide-slate-100 text-sm">
                {estimateRows.map((row) => (
                  <li key={row.label} className="flex justify-between gap-3 py-2">
                    <span className="text-slate-700">{row.label}</span>
                    <span className="tabular-nums font-medium text-[#0b1f3a]">
                      {formatInr(row.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : estimated == null ? (
              <div className="mt-4">
                <EmptyBlock
                  title="No estimate breakdown"
                  body="Run the cost calculator and save results to this project to populate estimate details."
                  action={{ href: '/construction/cost-calculator', label: 'Estimate project cost' }}
                />
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                A total estimate exists, but no detailed breakdown rows are stored.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === 'materials' ? (
        <section className="space-y-4">
          {(project.items?.length ?? 0) > 0 ? (
            <div className={cn(cx.card, 'overflow-x-auto p-4 sm:p-5')}>
              <h3 className="text-sm font-bold text-[#0b1f3a]">Material line items</h3>
              <table className="mt-3 min-w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2 pr-3">Item</th>
                    <th className="py-2 pr-3">Qty</th>
                    <th className="py-2 pr-3">Unit cost</th>
                    <th className="py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {project.items!.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3 font-medium text-[#0b1f3a]">
                        {item.name || item.material?.name || 'Material'}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">
                        {item.quantity ?? '—'}
                        {item.unit ? ` ${item.unit}` : ''}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">
                        {toNum(item.unitCost) != null ? formatInr(toNum(item.unitCost)!) : '—'}
                      </td>
                      <td className="py-2 tabular-nums">
                        {toNum(item.estimatedCost) != null
                          ? formatInr(toNum(item.estimatedCost)!)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyBlock
              title="No material quantities yet"
              body="Material calculators and saved calculations will appear here once linked to this project."
              action={{
                href: '/construction/cement-calculator',
                label: 'Open material calculators',
              }}
            />
          )}
          {(project.calculations?.length ?? 0) > 0 ? (
            <div className={cn(cx.card, 'p-5')}>
              <h3 className="text-sm font-bold text-[#0b1f3a]">Saved calculations</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {project.calculations!.map((c) => (
                  <li
                    key={c.id}
                    className="flex justify-between gap-3 border-b border-slate-100 py-2"
                  >
                    <span>{c.calculatorSlug || 'Calculation'}</span>
                    <span className="text-xs text-slate-500">{formatDate(c.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === 'boq' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/construction/boq-generator?projectId=${project.id}`}
              className={cx.primaryBtn}
            >
              Open BOQ Generator
            </Link>
          </div>
          {(project.boqs?.length ?? 0) > 0 ? (
            <ul className="space-y-3">
              {project.boqs!.map((boq) => (
                <li key={boq.id} className={cn(cx.card, 'p-4')}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#0b1f3a]">
                        {boq.name || 'BOQ'} · v{boq.version ?? 1}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {[boq.status, formatDate(boq.updatedAt ?? boq.createdAt)]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Indicative planning BOQ — not a professional tender document.
                      </p>
                    </div>
                    <Link
                      href={`/construction/boq-generator?projectId=${project.id}&boqId=${boq.id}`}
                      className="text-sm font-medium text-[#f97316] hover:underline"
                    >
                      Open / edit
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBlock
              title="No BOQ yet"
              body="Generate an indicative planning BOQ from project assumptions, or build one manually. This is not a tender BOQ."
              action={{
                href: `/construction/boq-generator?projectId=${project.id}`,
                label: 'Generate BOQ',
              }}
            />
          )}
        </section>
      ) : null}

      {activeTab === 'timeline' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/construction/timeline-planner?projectId=${project.id}`}
              className={cx.primaryBtn}
            >
              Open timeline planner
            </Link>
          </div>
          {(project.phases?.length ?? 0) > 0 ? (
            <ol className="space-y-3">
              {project.phases!.map((phase) => {
                const notesClean = String(phase.notes ?? '')
                  .replace(/<!--varnarc-timeline:\{.*?\}-->/g, '')
                  .trim();
                return (
                  <li key={phase.id} className={cn(cx.card, 'p-4')}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#0b1f3a]">{phase.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {[
                            phase.status,
                            formatDate(phase.plannedStart),
                            formatDate(phase.plannedEnd)
                              ? `→ ${formatDate(phase.plannedEnd)}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Durations saved from the planner are estimates — verify on site.
                        </p>
                      </div>
                      <Link
                        href={`/construction/timeline-planner?projectId=${project.id}`}
                        className="text-sm font-medium text-[#f97316] hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                    {notesClean ? (
                      <p className="mt-2 text-sm text-slate-600">{notesClean}</p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyBlock
              title="No project timeline"
              body="Generate estimated phases with the timeline planner, then edit durations and status. Not a contractor programme."
              action={{
                href: `/construction/timeline-planner?projectId=${project.id}`,
                label: 'Plan timeline',
              }}
            />
          )}
        </section>
      ) : null}

      {activeTab === 'budget' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/construction/budget-tracker?projectId=${project.id}`}
              className={cx.primaryBtn}
            >
              Open budget tracker
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Budget total"
              value={budgetTotal != null ? formatInr(budgetTotal) : '—'}
            />
            <MetricCard label="Actual spent" value={spent != null ? formatInr(spent) : '—'} />
            <MetricCard
              label="Variance"
              value={variance != null ? `${variance >= 0 ? '+' : ''}${formatInr(variance)}` : '—'}
            />
          </div>
          {(project.budgetItems?.length ?? 0) > 0 ? (
            <div className={cn(cx.card, 'p-5')}>
              <h3 className="text-sm font-bold text-[#0b1f3a]">Budget lines</h3>
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {project.budgetItems!.map((line) => (
                  <li key={line.id} className="flex justify-between gap-3 py-2">
                    <span>
                      <span className="font-medium text-[#0b1f3a]">{line.name}</span>
                      {line.category ? (
                        <span className="ml-2 text-xs text-slate-500">{line.category}</span>
                      ) : null}
                    </span>
                    <span className="tabular-nums">
                      {toNum(line.plannedAmount) != null
                        ? formatInr(toNum(line.plannedAmount)!)
                        : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyBlock
              title="No budget lines"
              body={
                budgetTotal != null
                  ? 'A planning budget exists from project setup, but no detailed budget lines are saved yet.'
                  : 'Set budget lines to track planned spend by category. Categories map to BOQ where possible.'
              }
              action={{
                href: `/construction/budget-tracker?projectId=${project.id}`,
                label: 'Add budget lines',
              }}
            />
          )}
          {(project.expenses?.length ?? 0) > 0 ? (
            <div className={cn(cx.card, 'p-5')}>
              <h3 className="text-sm font-bold text-[#0b1f3a]">Expenses</h3>
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {project.expenses!.map((expense) => (
                  <li key={expense.id} className="flex justify-between gap-3 py-2">
                    <span>
                      <span className="font-medium text-[#0b1f3a]">
                        {expense.name || 'Expense'}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        {formatDate(expense.spentOn)}
                      </span>
                    </span>
                    <span className="tabular-nums">
                      {toNum(expense.amount) != null ? formatInr(toNum(expense.amount)!) : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyBlock
              title="No expenses yet"
              body="Record expenses with payment status (paid / committed / pending) to track spent vs committed."
              action={{
                href: `/construction/budget-tracker?projectId=${project.id}`,
                label: 'Add expense',
              }}
            />
          )}
        </section>
      ) : null}

      {activeTab === 'quotes' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/construction/document-vault?projectId=${encodeURIComponent(project.id)}`}
              className={cx.primaryBtn}
            >
              Open document vault
            </Link>
          </div>
          {quoteDocs.length ? (
            <ul className="space-y-3">
              {quoteDocs.map((doc) => (
                <li key={doc.id} className={cn(cx.card, 'p-4')}>
                  <p className="font-semibold text-[#0b1f3a]">{doc.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(doc.createdAt)}</p>
                  <a
                    href={`/api/construction/documents/${doc.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(cx.link, 'mt-2 inline-block')}
                  >
                    View / download (private)
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBlock
              title="No contractor quotes"
              body="Upload quote PDFs in the document vault and link them to this project. Nothing has been added yet."
              action={{
                href: `/construction/document-vault?projectId=${encodeURIComponent(project.id)}`,
                label: 'Open document vault',
              }}
            />
          )}
        </section>
      ) : null}

      {activeTab === 'documents' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/construction/document-vault?projectId=${encodeURIComponent(project.id)}`}
              className={cx.primaryBtn}
            >
              Manage documents
            </Link>
          </div>
          {otherDocs.length || quoteDocs.length ? (
            <ul className="space-y-3">
              {[...otherDocs, ...quoteDocs].map((doc) => (
                <li key={doc.id} className={cn(cx.card, 'p-4')}>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {doc.kind || 'Document'}
                  </p>
                  <p className="mt-1 font-semibold text-[#0b1f3a]">{doc.title}</p>
                  {doc.notes ? <p className="mt-1 text-sm text-slate-600">{doc.notes}</p> : null}
                  <a
                    href={`/api/construction/documents/${doc.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(cx.link, 'mt-2 inline-block')}
                  >
                    View / download (private)
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBlock
              title="No documents uploaded"
              body="Floor plans, drawings, invoices and site photos live in the private document vault — never on public URLs."
              action={{
                href: `/construction/document-vault?projectId=${encodeURIComponent(project.id)}`,
                label: 'Open document vault',
              }}
            />
          )}
        </section>
      ) : null}

      {activeTab === 'suppliers' ? (
        <section className="space-y-4">
          <EmptyBlock
            title="No suppliers linked to this project"
            body="This project does not store linked suppliers yet. Browse the directory to find contractors and material vendors — listings below are not treated as project data."
            action={{ href: '/construction/suppliers', label: 'Find suppliers' }}
          />
          {suppliers.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Directory suggestions (not linked)
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {suppliers.slice(0, 6).map((s) => (
                  <li key={s.id} className={cn(cx.card, 'p-4 opacity-90')}>
                    <p className="font-semibold text-[#0b1f3a]">{s.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {[s.city, s.category].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
