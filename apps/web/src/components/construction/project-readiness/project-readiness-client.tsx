'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  PROJECT_READINESS_CATEGORIES,
  PROJECT_READINESS_ITEMS,
  PROJECT_READINESS_METHODOLOGY,
  PROJECT_READINESS_QUALIFICATION,
  PROJECT_READINESS_STATUSES,
  defaultProjectReadinessAnswers,
  evaluateProjectReadiness,
  type ProjectReadinessResult,
  type ProjectReadinessStatus,
} from '@varnarc/validation';
import { CalculatorShell, MethodologyPanel } from '@/components/construction/calculator';
import { cn } from '@/components/construction/styles';
import { PROJECT_READINESS_FAQS, PROJECT_READINESS_RELATED } from './content';

const FALLBACK_CATEGORY_STYLE = {
  badge: 'bg-amber-600 text-white',
  border: 'border-amber-200 bg-amber-50/60',
  heading: 'text-amber-900',
};

const categoryStyles: Record<string, { badge: string; border: string; heading: string }> = {
  ready: {
    badge: 'bg-emerald-700 text-white',
    border: 'border-emerald-200 bg-emerald-50/60',
    heading: 'text-emerald-900',
  },
  needs_attention: FALLBACK_CATEGORY_STYLE,
  high_priority_gaps: {
    badge: 'bg-[#0b1f3a] text-white',
    border: 'border-slate-300 bg-slate-50',
    heading: 'text-[#0b1f3a]',
  },
};

type Props = {
  initialAnswers?: Partial<Record<string, ProjectReadinessStatus>>;
};

export function ProjectReadinessClient({ initialAnswers }: Props) {
  const [answers, setAnswers] = useState(() => {
    const base = defaultProjectReadinessAnswers();
    if (initialAnswers) {
      for (const [k, v] of Object.entries(initialAnswers)) {
        if (k in base && v) (base as Record<string, ProjectReadinessStatus>)[k] = v;
      }
    }
    return base;
  });
  const [result, setResult] = useState<ProjectReadinessResult | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, Array<(typeof PROJECT_READINESS_ITEMS)[number]>>();
    for (const item of PROJECT_READINESS_ITEMS) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return Array.from(map.entries());
  }, []);

  function setStatus(key: string, status: ProjectReadinessStatus) {
    setAnswers((prev) => ({ ...prev, [key]: status }));
    setResult(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(evaluateProjectReadiness({ answers }));
  }

  function markAll(status: ProjectReadinessStatus) {
    const next = defaultProjectReadinessAnswers();
    for (const key of Object.keys(next) as Array<keyof typeof next>) {
      next[key] = status;
    }
    setAnswers(next);
    setResult(null);
  }

  const overallStyle = result
    ? (categoryStyles[result.overallCategory] ?? FALLBACK_CATEGORY_STYLE)
    : null;

  return (
    <CalculatorShell
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Project readiness' },
      ]}
      title="Construction Project Readiness Checker"
      description="Score your planning checklist — budget, drawings, BOQ, quotes, timeline and more. Planning assistance only; not an engineering or structural safety review."
      form={
        <form onSubmit={onSubmit} className="space-y-8">
          <p className="text-sm leading-relaxed text-slate-600">
            {PROJECT_READINESS_QUALIFICATION}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => markAll('not_started')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              Reset all
            </button>
            <button
              type="button"
              onClick={() => markAll('done')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              Mark all done
            </button>
          </div>

          {groups.map(([group, items]) => (
            <section key={group}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#0b1f3a]">{group}</h2>
              <ul className="mt-3 space-y-4">
                {items.map((item) => (
                  <li
                    key={item.key}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#0b1f3a]">{item.label}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                          Priority: {item.priority}
                        </p>
                      </div>
                    </div>
                    <fieldset className="mt-3">
                      <legend className="sr-only">Status for {item.label}</legend>
                      <div className="flex flex-wrap gap-2">
                        {PROJECT_READINESS_STATUSES.map((s) => {
                          const active = answers[item.key] === s.key;
                          return (
                            <label
                              key={s.key}
                              className={cn(
                                'cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold',
                                active
                                  ? 'border-[#0b1f3a] bg-[#0b1f3a] text-white'
                                  : 'border-slate-200 bg-slate-50 text-slate-700',
                              )}
                            >
                              <input
                                type="radio"
                                className="sr-only"
                                name={item.key}
                                value={s.key}
                                checked={active}
                                onChange={() => setStatus(item.key, s.key)}
                              />
                              {s.label}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <button
            type="submit"
            className="inline-flex rounded-lg bg-[#f97316] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#ea580c]"
          >
            Calculate readiness score
          </button>
        </form>
      }
      result={
        result ? (
          <div className="space-y-8">
            <div className={cn('rounded-2xl border p-5', overallStyle?.border)}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Planning readiness score
              </p>
              <p className="mt-1 text-4xl font-extrabold text-[#0b1f3a]">{result.scoreLabel}</p>
              <span
                className={cn(
                  'mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase',
                  overallStyle?.badge,
                )}
              >
                {result.overallCategoryLabel}
              </span>
              <p className="mt-4 text-sm leading-relaxed text-slate-700">
                {result.scoreExplanation}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                {result.doneCount} of {result.applicableCount} applicable items marked done
                {result.hasCriticalGap
                  ? ' · At least one critical planning item is still not started'
                  : ''}
              </p>
            </div>

            {PROJECT_READINESS_CATEGORIES.map((cat) => {
              const list = result.categories[cat.key];
              if (!list.length) return null;
              const style = categoryStyles[cat.key] ?? FALLBACK_CATEGORY_STYLE;
              return (
                <section key={cat.key}>
                  <h3 className={cn('text-base font-bold', style.heading)}>{cat.label}</h3>
                  <p className="mt-1 text-xs text-slate-500">{cat.description}</p>
                  <ul className="mt-3 space-y-2">
                    {list.map((item) => (
                      <li
                        key={item.key}
                        className={cn('rounded-lg border px-3 py-2 text-sm', style.border)}
                      >
                        <span className="font-semibold text-slate-800">{item.label}</span>
                        <span className="ml-2 text-xs text-slate-500">
                          {item.statusLabel} · {item.priorityLabel}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}

            {result.recommendedNextSteps.length ? (
              <section>
                <h3 className="text-base font-bold text-[#0b1f3a]">Recommended next steps</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Based on missing or incomplete planning items — open the matching Varnarc tool.
                </p>
                <ul className="mt-4 space-y-3">
                  {result.recommendedNextSteps.map((step) => (
                    <li
                      key={`${step.itemKey}-${step.href}-${step.label}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#0b1f3a]">{step.label}</p>
                        <p className="text-xs text-slate-500">{step.reason}</p>
                      </div>
                      <Link
                        href={step.href}
                        className="shrink-0 rounded-lg bg-[#0b1f3a] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Open →
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className="text-sm text-slate-600">
                No gaps on the checklist you submitted — still verify designs and contracts with
                qualified professionals.
              </p>
            )}

            <p className="text-xs leading-relaxed text-slate-500">{result.disclaimer}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Mark each planning item, then calculate your readiness score. Results stay on this page
            until you recalculate.
          </p>
        )
      }
      methodology={
        <MethodologyPanel
          title="How the score is calculated"
          formula="score = round(100 × earned weight ÷ applicable weight)"
          steps={[
            'Critical items weight 3, high 2, medium 1.',
            'Done = full weight; In progress = half; Not started = 0; Not applicable excluded.',
            'Ready ≥80 (unless a critical item is Not started); Needs attention 50–79; otherwise High-priority gaps.',
            'Does not score technical engineering adequacy.',
            'Does not say a project is structurally safe.',
            'Recommended next steps link to Varnarc planning tools where available.',
            PROJECT_READINESS_METHODOLOGY,
          ]}
        />
      }
      faqs={PROJECT_READINESS_FAQS.map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
      }))}
      relatedTools={PROJECT_READINESS_RELATED}
    />
  );
}
