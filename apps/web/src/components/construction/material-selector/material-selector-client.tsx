'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalculatorShell } from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import {
  MATERIAL_SELECTOR_DEFINITIONS,
  MATERIAL_SELECTOR_QUALIFICATION,
  MATERIAL_SELECTOR_TASKS,
  runSelector,
  type MaterialSelectorTaskId,
  type SelectorSuggestion,
} from '@/lib/construction/material-selector/catalog';
import {
  trackMaterialSelectorCompleted,
  trackMaterialSelectorResultClicked,
  trackMaterialSelectorStarted,
} from '@/lib/construction/analytics';
import { cn, cx } from '@/components/construction/styles';
import {
  MATERIAL_SELECTOR_FAQS,
  MATERIAL_SELECTOR_RELATED,
  MATERIAL_SELECTOR_SEO,
} from './content';

type Step = 'task' | 'questions' | 'results';

export function MaterialSelectorClient() {
  const [step, setStep] = useState<Step>('task');
  const [taskId, setTaskId] = useState<MaterialSelectorTaskId | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [results, setResults] = useState<SelectorSuggestion[]>([]);
  const startedRef = useRef(false);
  const completedRef = useRef(false);

  const task = useMemo(
    () => MATERIAL_SELECTOR_DEFINITIONS.find((t) => t.id === taskId) ?? null,
    [taskId],
  );

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      trackMaterialSelectorStarted({ path: '/construction/material-selector' });
    }
  }, []);

  function selectTask(id: MaterialSelectorTaskId) {
    setTaskId(id);
    setAnswers({});
    setQuestionIndex(0);
    setResults([]);
    completedRef.current = false;
    setStep('questions');
    trackMaterialSelectorStarted({
      path: '/construction/material-selector',
      task_id: id,
    });
  }

  function setAnswer(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function goNextQuestion() {
    if (!task) return;
    const q = task.questions[questionIndex];
    if (!q || !answers[q.id]) return;
    if (questionIndex < task.questions.length - 1) {
      setQuestionIndex((i) => i + 1);
      return;
    }
    const suggestions = runSelector(task.id, answers);
    setResults(suggestions);
    setStep('results');
    if (!completedRef.current) {
      completedRef.current = true;
      const answerKeys = Object.entries(answers).map(([k, v]) => `${k}:${v}`);
      trackMaterialSelectorCompleted({
        path: '/construction/material-selector',
        task_id: task.id,
        answer_keys: answerKeys,
        result_count: suggestions.length,
      });
    }
  }

  function resetAll() {
    setStep('task');
    setTaskId(null);
    setAnswers({});
    setQuestionIndex(0);
    setResults([]);
    completedRef.current = false;
  }

  function trackOutbound(
    suggestion: SelectorSuggestion,
    targetType: 'calculator' | 'material' | 'comparison',
    href: string,
  ) {
    trackMaterialSelectorResultClicked({
      path: '/construction/material-selector',
      task_id: taskId ?? undefined,
      suggestion_id: suggestion.id,
      target_type: targetType,
      target_path: href,
    });
  }

  const currentQuestion = task?.questions[questionIndex];
  const progress =
    step === 'task'
      ? 0
      : step === 'questions' && task
        ? Math.round(((questionIndex + 1) / (task.questions.length + 1)) * 100)
        : 100;

  const form = (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-slate-600">{MATERIAL_SELECTOR_QUALIFICATION}</p>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#0b1f3a] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {step === 'task' ? (
        <div>
          <h3 className="text-sm font-semibold text-[#0b1f3a]">Choose a construction task</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {MATERIAL_SELECTOR_TASKS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => selectTask(t.id)}
                  className={cn(
                    cx.card,
                    cx.focus,
                    'w-full p-4 text-left transition hover:ring-[#f97316]/40',
                  )}
                >
                  <span className="font-semibold text-[#0b1f3a]">{t.label}</span>
                  <span className="mt-1 block text-sm text-slate-600">{t.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {step === 'questions' && task && currentQuestion ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#f97316]">
              {task.label} · Question {questionIndex + 1} of {task.questions.length}
            </p>
            <button type="button" className={cx.link} onClick={resetAll}>
              Change task
            </button>
          </div>
          <h3 className="text-base font-bold text-[#0b1f3a]">{currentQuestion.prompt}</h3>
          {currentQuestion.help ? (
            <p className="text-sm text-slate-600">{currentQuestion.help}</p>
          ) : null}
          <ul className="space-y-2">
            {currentQuestion.options.map((opt) => {
              const selected = answers[currentQuestion.id] === opt.id;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => setAnswer(currentQuestion.id, opt.id)}
                    className={cn(
                      'w-full rounded-lg border px-4 py-3 text-left text-sm transition',
                      selected
                        ? 'border-[#f97316] bg-orange-50 text-[#0b1f3a]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#0b1f3a]/30',
                    )}
                  >
                    <span className="font-semibold">{opt.label}</span>
                    {opt.hint ? (
                      <span className="mt-0.5 block text-xs text-slate-500">{opt.hint}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cx.secondaryBtn}
              disabled={questionIndex === 0}
              onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
            >
              Back
            </button>
            <button
              type="button"
              className={cx.primaryBtn}
              disabled={!answers[currentQuestion.id]}
              onClick={goNextQuestion}
            >
              {questionIndex < task.questions.length - 1 ? 'Next' : 'See suggestions'}
            </button>
          </div>
        </div>
      ) : null}

      {step === 'results' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#0b1f3a]">
              Categories to consider
              {task ? <span className="font-normal text-slate-500"> · {task.label}</span> : null}
            </h3>
            <button type="button" className={cx.link} onClick={resetAll}>
              Start over
            </button>
          </div>
          <p className="text-sm text-slate-600">
            These are educational shortlists — verify specifications on drawings and with your
            project team. No brands are recommended.
          </p>
        </div>
      ) : null}
    </div>
  );

  const resultNode =
    step === 'results' ? (
      <div className="space-y-4">
        {results.length === 0 ? (
          <p className="text-sm text-slate-600">
            No suggestions for this combination. Try different answers or browse the materials hub.
          </p>
        ) : (
          results.map((s) => (
            <article key={s.id} className={cn(cx.card, 'space-y-3 p-4 sm:p-5')}>
              <h4 className="text-lg font-bold text-[#0b1f3a]">{s.category}</h4>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#f97316]">
                  Why this category may fit
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{s.whyFits}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Advantages
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700">
                    {s.advantages.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Limitations
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700">
                    {s.limitations.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Specifications to verify
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700">
                  {s.specsToVerify.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {s.relatedComparison ? (
                  <Link
                    href={s.relatedComparison.href}
                    className={cx.secondaryBtn}
                    onClick={() => trackOutbound(s, 'comparison', s.relatedComparison!.href)}
                  >
                    {s.relatedComparison.label}
                  </Link>
                ) : null}
                {s.relatedCalculator ? (
                  <Link
                    href={s.relatedCalculator.href}
                    className={cx.primaryBtn}
                    onClick={() => trackOutbound(s, 'calculator', s.relatedCalculator!.href)}
                  >
                    {s.relatedCalculator.label}
                  </Link>
                ) : null}
                {s.materialGuideHref ? (
                  <Link
                    href={s.materialGuideHref}
                    className={cx.secondaryBtn}
                    onClick={() => trackOutbound(s, 'material', s.materialGuideHref!)}
                  >
                    Material guide
                  </Link>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    ) : (
      <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200/80">
        Select a task and answer the context questions to see material categories and specifications
        to verify.
      </div>
    );

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Material selector' },
        ]}
        title="Material selector"
        description="Educational shortlists by construction task — not engineering approval or brand picks."
        lastUpdated="Aug 2026"
        form={form}
        result={resultNode}
        seoContent={<p>{MATERIAL_SELECTOR_SEO}</p>}
        faqs={MATERIAL_SELECTOR_FAQS}
        relatedTools={MATERIAL_SELECTOR_RELATED}
        methodology={
          <p className="text-sm leading-relaxed text-slate-700">
            Recommendations are rule-based mappings from your answers to material categories and
            specification themes. They do not size structures, approve products or endorse brands.
            Always cross-check project drawings and local codes with qualified professionals.
          </p>
        }
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={MATERIAL_SELECTOR_RELATED} />
      </div>
    </>
  );
}
