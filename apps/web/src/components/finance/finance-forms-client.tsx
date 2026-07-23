'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';
import { getApiBaseUrl } from '@/services/api-client';
import type {
  FinanceCreditScoreResult,
  FinanceEligibilityResult,
  FinanceGoal,
} from '@/services/finance';

const inputClass =
  'h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-[#0b1f3a]';

export function EligibilityCheckForm() {
  const [loanType, setLoanType] = useState('personal');
  const [income, setIncome] = useState('');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<FinanceEligibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/eligibility/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanType,
          income: Number(income),
          amount: Number(amount),
        }),
      });
      const json = (await res.json()) as { data?: FinanceEligibilityResult; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Check failed');
      setResult(json.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <form onSubmit={(e) => void submit(e)} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Loan type</label>
          <select className={inputClass} value={loanType} onChange={(e) => setLoanType(e.target.value)}>
            <option value="personal">Personal</option>
            <option value="home">Home</option>
            <option value="car">Car</option>
            <option value="business">Business</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Monthly income (₹)</label>
          <input className={inputClass} type="number" value={income} onChange={(e) => setIncome(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Loan amount (₹)</label>
          <input className={inputClass} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading}>{loading ? 'Checking…' : 'Check eligibility'}</Button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {result ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-[#0b1f3a]">
            {result.eligible ? 'You may be eligible' : 'May not be eligible'}
          </p>
          {result.message ? <p className="mt-2 text-slate-700">{result.message}</p> : null}
          {result.maxAmount != null ? (
            <p className="mt-1 text-slate-600">Suggested max: ₹{result.maxAmount}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function CreditScoreCheckForm() {
  const [pan, setPan] = useState('');
  const [name, setName] = useState('');
  const [result, setResult] = useState<FinanceCreditScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/credit-score/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan: pan || undefined, name: name || undefined }),
      });
      const json = (await res.json()) as { data?: FinanceCreditScoreResult; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Check failed');
      setResult(json.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <form onSubmit={(e) => void submit(e)} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">PAN (optional mock)</label>
          <input className={inputClass} value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading}>{loading ? 'Checking…' : 'Check credit score'}</Button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {result ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          {result.score != null ? (
            <p className="text-2xl font-extrabold text-[#0b1f3a]">{result.score}</p>
          ) : null}
          {result.band ? <p className="mt-1 font-medium text-slate-700">Band: {result.band}</p> : null}
          {result.message ? <p className="mt-2 text-slate-600">{result.message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function FinanceGoalCreateForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          targetAmount: targetAmount ? Number(targetAmount) : undefined,
          targetDate: targetDate || undefined,
          category: category || undefined,
        }),
      });
      const json = (await res.json()) as { data?: FinanceGoal; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create goal');
      setName('');
      setTargetAmount('');
      setTargetDate('');
      setCategory('');
      setMessage('Goal created');
      onCreated?.();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="mb-8 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-extrabold text-[#0b1f3a]">Create a goal</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputClass} placeholder="Goal name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={inputClass} placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input className={inputClass} type="number" placeholder="Target amount (₹)" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
        <input className={inputClass} type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading || !name}>{loading ? 'Saving…' : 'Add goal'}</Button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
