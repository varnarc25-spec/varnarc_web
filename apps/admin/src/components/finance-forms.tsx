'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function FinancePublishButton({
  entity,
  id,
  status,
}: {
  entity: 'banks' | 'loans' | 'credit-cards' | 'insurance' | 'investments';
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status === 'PUBLISHED') return null;

  async function publish() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/finance/${entity}/${id}/publish`, { method: 'POST' });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Publish failed');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => void publish()}>
      {loading ? 'Publishing…' : 'Publish'}
    </Button>
  );
}

export function FinanceBankForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/finance/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          website: website || undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setName('');
      setSlug('');
      setWebsite('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="New bank" message={message}>
      <div className="grid gap-3 md:grid-cols-3">
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <FormActions loading={loading} disabled={!name} onSave={() => void save()} />
    </FinanceFormShell>
  );
}

export function FinanceLoanForm({ banks }: { banks: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [bankId, setBankId] = useState(banks[0]?.id ?? '');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loanType, setLoanType] = useState('personal');
  const [interestRate, setInterestRate] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/finance/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId,
          name,
          slug: slug || slugify(name),
          loanType,
          interestRate: interestRate ? Number(interestRate) : undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setName('');
      setSlug('');
      setInterestRate('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="New loan" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <select className={inputClass} value={bankId} onChange={(e) => setBankId(e.target.value)}>
          {banks.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Loan type" value={loanType} onChange={(e) => setLoanType(e.target.value)} />
        <input className={inputClass} placeholder="Interest rate (%)" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
      </div>
      <FormActions loading={loading} disabled={!name || !bankId} onSave={() => void save()} />
    </FinanceFormShell>
  );
}

export function FinanceCreditCardForm({ banks }: { banks: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [bankId, setBankId] = useState(banks[0]?.id ?? '');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [annualFee, setAnnualFee] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/finance/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId,
          name,
          slug: slug || slugify(name),
          annualFee: annualFee ? Number(annualFee) : undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setName('');
      setSlug('');
      setAnnualFee('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="New credit card" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <select className={inputClass} value={bankId} onChange={(e) => setBankId(e.target.value)}>
          {banks.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Annual fee" value={annualFee} onChange={(e) => setAnnualFee(e.target.value)} />
      </div>
      <FormActions loading={loading} disabled={!name || !bankId} onSave={() => void save()} />
    </FinanceFormShell>
  );
}

export function FinanceInsuranceForm() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [premium, setPremium] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/finance/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName,
          name,
          slug: slug || slugify(name),
          premium: premium ? Number(premium) : undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setProviderName('');
      setName('');
      setSlug('');
      setPremium('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="New insurance product" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <input className={inputClass} placeholder="Provider" value={providerName} onChange={(e) => setProviderName(e.target.value)} />
        <input className={inputClass} placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Premium (annual)" value={premium} onChange={(e) => setPremium(e.target.value)} />
      </div>
      <FormActions loading={loading} disabled={!name || !providerName} onSave={() => void save()} />
    </FinanceFormShell>
  );
}

export function FinanceInvestmentForm() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/finance/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName,
          name,
          slug: slug || slugify(name),
          expectedReturn: expectedReturn ? Number(expectedReturn) : undefined,
          riskLevel: riskLevel || undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setProviderName('');
      setName('');
      setSlug('');
      setExpectedReturn('');
      setRiskLevel('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="New investment product" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <input className={inputClass} placeholder="Provider" value={providerName} onChange={(e) => setProviderName(e.target.value)} />
        <input className={inputClass} placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Expected return (%)" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} />
        <input className={inputClass} placeholder="Risk level" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} />
      </div>
      <FormActions loading={loading} disabled={!name || !providerName} onSave={() => void save()} />
    </FinanceFormShell>
  );
}

export function FinanceRateForm({ banks }: { banks: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [bankId, setBankId] = useState(banks[0]?.id ?? '');
  const [productType, setProductType] = useState('home-loan');
  const [rate, setRate] = useState('');
  const [source, setSource] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/finance/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId: bankId || undefined,
          productType,
          rate: Number(rate),
          source: source || undefined,
          effectiveFrom: new Date().toISOString(),
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setRate('');
      setSource('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="New interest rate" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <select className={inputClass} value={bankId} onChange={(e) => setBankId(e.target.value)}>
          <option value="">No bank</option>
          {banks.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <input className={inputClass} placeholder="Product type" value={productType} onChange={(e) => setProductType(e.target.value)} />
        <input className={inputClass} placeholder="Rate (%)" value={rate} onChange={(e) => setRate(e.target.value)} />
        <input className={inputClass} placeholder="Source" value={source} onChange={(e) => setSource(e.target.value)} />
      </div>
      <FormActions loading={loading} disabled={!rate || !productType} onSave={() => void save()} />
    </FinanceFormShell>
  );
}

function FinanceFormShell({
  title,
  message,
  children,
}: {
  title: string;
  message: string | null;
  children: ReactNode;
}) {
  return (
    <div className="mb-6 space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
      {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
    </div>
  );
}

function FormActions({
  loading,
  disabled,
  onSave,
  label = 'Create',
  loadingLabel = 'Creating…',
}: {
  loading: boolean;
  disabled: boolean;
  onSave: () => void;
  label?: string;
  loadingLabel?: string;
}) {
  return (
    <Button type="button" disabled={loading || disabled} onClick={onSave}>
      {loading ? loadingLabel : label}
    </Button>
  );
}

export function FinanceBankEditForm({
  id,
  initial,
}: {
  id: string;
  initial: { name: string; slug: string; website?: string | null; description?: string | null };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [website, setWebsite] = useState(initial.website ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/finance/banks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          website: website || undefined,
          description: description || undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="Edit bank" message={message}>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} />
        <textarea
          className={`${inputClass} min-h-24 py-2`}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <FormActions loading={loading} disabled={!name} onSave={() => void save()} label="Save changes" loadingLabel="Saving…" />
    </FinanceFormShell>
  );
}

export function FinanceLoanEditForm({
  id,
  banks,
  initial,
}: {
  id: string;
  banks: Array<{ id: string; name: string }>;
  initial: {
    bankId: string;
    name: string;
    slug: string;
    loanType: string;
    interestRate?: number | string | null;
    affiliateUrl?: string | null;
  };
}) {
  const router = useRouter();
  const [bankId, setBankId] = useState(initial.bankId);
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [loanType, setLoanType] = useState(initial.loanType);
  const [interestRate, setInterestRate] = useState(
    initial.interestRate != null ? String(initial.interestRate) : '',
  );
  const [affiliateUrl, setAffiliateUrl] = useState(initial.affiliateUrl ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/finance/loans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId,
          name,
          slug,
          loanType,
          interestRate: interestRate ? Number(interestRate) : undefined,
          affiliateUrl: affiliateUrl || undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="Edit loan" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <select className={inputClass} value={bankId} onChange={(e) => setBankId(e.target.value)}>
          {banks.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Loan type" value={loanType} onChange={(e) => setLoanType(e.target.value)} />
        <input className={inputClass} placeholder="Interest rate (%)" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
        <input className={inputClass} placeholder="Affiliate URL" value={affiliateUrl} onChange={(e) => setAffiliateUrl(e.target.value)} />
      </div>
      <FormActions loading={loading} disabled={!name || !bankId} onSave={() => void save()} label="Save changes" loadingLabel="Saving…" />
    </FinanceFormShell>
  );
}

export function FinanceFaqForm() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/finance/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, category: category || undefined }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setQuestion('');
      setAnswer('');
      setCategory('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="New FAQ" message={message}>
      <div className="grid gap-3">
        <input className={inputClass} placeholder="Question" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <textarea className={`${inputClass} min-h-24 py-2`} placeholder="Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        <input className={inputClass} placeholder="Category (optional)" value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <FormActions loading={loading} disabled={!question || !answer} onSave={() => void save()} />
    </FinanceFormShell>
  );
}

export function FinanceGlossaryForm() {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/finance/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, definition }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setTerm('');
      setDefinition('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="New glossary term" message={message}>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} placeholder="Term" value={term} onChange={(e) => setTerm(e.target.value)} />
        <textarea className={`${inputClass} min-h-20 py-2 md:col-span-2`} placeholder="Definition" value={definition} onChange={(e) => setDefinition(e.target.value)} />
      </div>
      <FormActions loading={loading} disabled={!term || !definition} onSave={() => void save()} />
    </FinanceFormShell>
  );
}

export function FinanceComparisonForm() {
  const router = useRouter();
  const [type, setType] = useState('loans');
  const [title, setTitle] = useState('');
  const [ids, setIds] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/finance/comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          ids: ids.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setTitle('');
      setIds('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="New comparison" message={message}>
      <div className="grid gap-3 md:grid-cols-3">
        <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="loans">Loans</option>
          <option value="credit-cards">Credit cards</option>
          <option value="insurance">Insurance</option>
          <option value="investments">Investments</option>
        </select>
        <input className={inputClass} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={inputClass} placeholder="Product IDs (comma-separated)" value={ids} onChange={(e) => setIds(e.target.value)} />
      </div>
      <FormActions loading={loading} disabled={!title || !ids} onSave={() => void save()} />
    </FinanceFormShell>
  );
}

export function FinanceRateFeedForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('http-json');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [productType, setProductType] = useState('home-loan');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/finance/rate-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, provider, endpointUrl: endpointUrl || null, productType }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setName('');
      setEndpointUrl('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="New rate feed" message={message}>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} placeholder="Feed name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className={inputClass} value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="http-json">HTTP JSON feed</option>
          <option value="mock">Mock (demo)</option>
        </select>
        <input
          className={inputClass}
          placeholder="Endpoint URL (JSON rates array)"
          value={endpointUrl}
          onChange={(e) => setEndpointUrl(e.target.value)}
        />
        <input className={inputClass} placeholder="Product type" value={productType} onChange={(e) => setProductType(e.target.value)} />
      </div>
      <p className="text-xs text-[var(--varnarc-subtle)]">
        JSON format: {'{ "rates": [{ "rate": 8.5, "bankSlug": "hdfc", "loanSlug": "home-loan" }] }'}
      </p>
      <FormActions loading={loading} disabled={!name || !provider} onSave={() => void save()} />
    </FinanceFormShell>
  );
}

export function FinanceRateFeedSyncButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function syncNow() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/finance/rate-feeds/${id}/sync`, { method: 'POST' });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Sync failed');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => void syncNow()}>
      {loading ? 'Syncing…' : 'Sync now'}
    </Button>
  );
}
