'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/services/api-client';

type AssistResult = {
  summary: string;
  insights: string[];
  nextSteps: string[];
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function CalculatorAiAssistant({
  calculatorName,
  calculatorSlug,
  inputs,
  outputs,
}: {
  calculatorName: string;
  calculatorSlug: string;
  inputs: Record<string, string | number | boolean>;
  outputs: Record<string, number>;
}) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/ai/features/status`);
        const json = (await res.json()) as { data?: { configured?: boolean } };
        if (!cancelled) setConfigured(Boolean(json.data?.configured));
      } catch {
        if (!cancelled) setConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function send(questionText: string) {
    const trimmed = questionText.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setQuestion('');
    try {
      const res = await fetch(`${getApiBaseUrl()}/ai/features/calculator-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculatorName,
          calculatorSlug,
          inputs,
          outputs,
          question: trimmed,
          messages: nextMessages.slice(0, -1),
        }),
      });
      const json = (await res.json()) as { data?: AssistResult; error?: { message?: string } };
      if (!res.ok || !json.data) {
        throw new Error(json.error?.message || 'Could not explain results');
      }
      const reply = [json.data.summary, ...(json.data.insights ?? []), ...(json.data.nextSteps ?? [])].join('\n');
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  if (configured === false) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-[#0b1f3a]">AI calculator assistant</h3>
      <p className="mt-1 text-xs text-slate-600">Ask follow-up questions about your results.</p>

      {messages.length ? (
        <div className="mt-4 max-h-64 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-sm">
          {messages.map((msg, index) => (
            <div key={`${msg.role}-${index}`} className={msg.role === 'user' ? 'text-right' : ''}>
              <span className="text-xs font-medium text-slate-500">{msg.role === 'user' ? 'You' : 'Assistant'}</span>
              <p className="mt-1 whitespace-pre-wrap text-slate-700">{msg.content}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="min-w-[12rem] flex-1 text-sm">
          <span className="mb-1 block text-slate-600">Your question</span>
          <input
            className="h-10 w-full rounded-lg border border-slate-200 px-3"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Is this EMI affordable?"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(question);
              }
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => void send(question || 'Explain these results')}
          disabled={loading}
          className="h-10 rounded-lg bg-[#f97316] px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Thinking…' : messages.length ? 'Ask follow-up' : 'Explain results'}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
