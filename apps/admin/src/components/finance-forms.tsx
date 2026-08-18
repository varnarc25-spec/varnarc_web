'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';
import { EntityMediaField, type EntityMediaValue } from '@/components/entity-media-field';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

function emptyMedia(): EntityMediaValue {
  return { mediaId: null, url: null, alt: '', title: '', caption: '' };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function FinanceSeoFields({
  seoTitle,
  seoDescription,
  onSeoTitleChange,
  onSeoDescriptionChange,
}: {
  seoTitle: string;
  seoDescription: string;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <input
        className={inputClass}
        placeholder="SEO title"
        value={seoTitle}
        onChange={(e) => onSeoTitleChange(e.target.value)}
      />
      <input
        className={inputClass}
        placeholder="SEO meta description"
        value={seoDescription}
        onChange={(e) => onSeoDescriptionChange(e.target.value)}
      />
    </div>
  );
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
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={loading}
      onClick={() => void publish()}
    >
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
        <input
          className={inputClass}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Website URL"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
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
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Loan type"
          value={loanType}
          onChange={(e) => setLoanType(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Interest rate (%)"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
        />
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
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Annual fee"
          value={annualFee}
          onChange={(e) => setAnnualFee(e.target.value)}
        />
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
        <input
          className={inputClass}
          placeholder="Provider"
          value={providerName}
          onChange={(e) => setProviderName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Premium (annual)"
          value={premium}
          onChange={(e) => setPremium(e.target.value)}
        />
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
        <input
          className={inputClass}
          placeholder="Provider"
          value={providerName}
          onChange={(e) => setProviderName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Expected return (%)"
          value={expectedReturn}
          onChange={(e) => setExpectedReturn(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Risk level"
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value)}
        />
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
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder="Product type"
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Rate (%)"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
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
  initial: {
    name: string;
    slug: string;
    website?: string | null;
    description?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    logoUrl?: string | null;
    logoMediaId?: string | null;
    logoAlt?: string | null;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [website, setWebsite] = useState(initial.website ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription ?? '');
  const [logo, setLogo] = useState<EntityMediaValue>({
    mediaId: initial.logoMediaId ?? null,
    url: initial.logoUrl ?? null,
    alt: initial.logoAlt ?? '',
  });
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
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          logoUrl: logo.url || null,
          logoMediaId: logo.mediaId || null,
          logoAlt: logo.alt || null,
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
        <input
          className={inputClass}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Website URL"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <textarea
          className={`${inputClass} min-h-24 py-2`}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <EntityMediaField
        label="Official lender logo"
        help="Use the lender’s official logo from the media library. AI-generated logos are not allowed."
        value={logo}
        onChange={setLogo}
      />
      <FinanceSeoFields
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        onSeoTitleChange={setSeoTitle}
        onSeoDescriptionChange={setSeoDescription}
      />
      <FormActions
        loading={loading}
        disabled={!name}
        onSave={() => void save()}
        label="Save changes"
        loadingLabel="Saving…"
      />
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
    seoTitle?: string | null;
    seoDescription?: string | null;
    prepaymentChargeText?: string | null;
    foreclosureChargeText?: string | null;
    metadata?: Record<string, unknown> | null;
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
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription ?? '');
  const [prepaymentChargeText, setPrepaymentChargeText] = useState(
    initial.prepaymentChargeText ?? '',
  );
  const [foreclosureChargeText, setForeclosureChargeText] = useState(
    initial.foreclosureChargeText ?? '',
  );
  const meta = (
    initial.metadata && typeof initial.metadata === 'object' ? initial.metadata : {}
  ) as Record<string, unknown>;
  const [vehicleCondition, setVehicleCondition] = useState(
    typeof meta.vehicleCondition === 'string' ? meta.vehicleCondition : '',
  );
  const [vehicleAgeMax, setVehicleAgeMax] = useState(
    meta.vehicleAgeMax != null ? String(meta.vehicleAgeMax) : '',
  );
  const [financingPercentageMin, setFinancingPercentageMin] = useState(
    meta.financingPercentageMin != null ? String(meta.financingPercentageMin) : '',
  );
  const [financingPercentageMax, setFinancingPercentageMax] = useState(
    meta.financingPercentageMax != null ? String(meta.financingPercentageMax) : '',
  );
  const [vehicleValuationRequired, setVehicleValuationRequired] = useState(
    meta.vehicleValuationRequired === true,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isCarLoan = /car|auto|vehicle/i.test(loanType);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const nextMeta: Record<string, unknown> = { ...meta };
      if (isCarLoan) {
        if (vehicleCondition) nextMeta.vehicleCondition = vehicleCondition;
        else delete nextMeta.vehicleCondition;
        if (vehicleAgeMax) nextMeta.vehicleAgeMax = Number(vehicleAgeMax);
        else delete nextMeta.vehicleAgeMax;
        if (financingPercentageMin)
          nextMeta.financingPercentageMin = Number(financingPercentageMin);
        else delete nextMeta.financingPercentageMin;
        if (financingPercentageMax)
          nextMeta.financingPercentageMax = Number(financingPercentageMax);
        else delete nextMeta.financingPercentageMax;
        nextMeta.vehicleValuationRequired = vehicleValuationRequired;
      }

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
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          prepaymentChargeText: prepaymentChargeText || null,
          foreclosureChargeText: foreclosureChargeText || null,
          metadata: nextMeta,
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
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Loan type"
          value={loanType}
          onChange={(e) => setLoanType(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Interest rate (%)"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Affiliate URL"
          value={affiliateUrl}
          onChange={(e) => setAffiliateUrl(e.target.value)}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <textarea
          className={`${inputClass} min-h-24 py-2`}
          placeholder="Prepayment charge text"
          value={prepaymentChargeText}
          onChange={(e) => setPrepaymentChargeText(e.target.value)}
        />
        <textarea
          className={`${inputClass} min-h-24 py-2`}
          placeholder="Foreclosure charge text"
          value={foreclosureChargeText}
          onChange={(e) => setForeclosureChargeText(e.target.value)}
        />
      </div>

      {isCarLoan ? (
        <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Car loan product fields</p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <select
              className={inputClass}
              value={vehicleCondition}
              onChange={(e) => setVehicleCondition(e.target.value)}
            >
              <option value="">Vehicle condition (unset)</option>
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="both">New & Used</option>
            </select>
            <input
              className={inputClass}
              placeholder="Max vehicle age (years)"
              value={vehicleAgeMax}
              onChange={(e) => setVehicleAgeMax(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Financing % min"
              value={financingPercentageMin}
              onChange={(e) => setFinancingPercentageMin(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Financing % max"
              value={financingPercentageMax}
              onChange={(e) => setFinancingPercentageMax(e.target.value)}
            />
            <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={vehicleValuationRequired}
                onChange={(e) => setVehicleValuationRequired(e.target.checked)}
              />
              Vehicle valuation required
            </label>
          </div>
        </div>
      ) : null}

      <FinanceSeoFields
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        onSeoTitleChange={setSeoTitle}
        onSeoDescriptionChange={setSeoDescription}
      />
      <FormActions
        loading={loading}
        disabled={!name || !bankId}
        onSave={() => void save()}
        label="Save changes"
        loadingLabel="Saving…"
      />
    </FinanceFormShell>
  );
}

export function FinanceCreditCardEditForm({
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
    annualFee?: number | string | null;
    affiliateUrl?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  };
}) {
  const router = useRouter();
  const [bankId, setBankId] = useState(initial.bankId);
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [annualFee, setAnnualFee] = useState(
    initial.annualFee != null ? String(initial.annualFee) : '',
  );
  const [affiliateUrl, setAffiliateUrl] = useState(initial.affiliateUrl ?? '');
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/finance/credit-cards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId,
          name,
          slug,
          annualFee: annualFee ? Number(annualFee) : undefined,
          affiliateUrl: affiliateUrl || undefined,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
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
    <FinanceFormShell title="Edit credit card" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <select className={inputClass} value={bankId} onChange={(e) => setBankId(e.target.value)}>
          {banks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Annual fee"
          value={annualFee}
          onChange={(e) => setAnnualFee(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Affiliate URL"
          value={affiliateUrl}
          onChange={(e) => setAffiliateUrl(e.target.value)}
        />
      </div>
      <FinanceSeoFields
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        onSeoTitleChange={setSeoTitle}
        onSeoDescriptionChange={setSeoDescription}
      />
      <FormActions
        loading={loading}
        disabled={!name || !bankId}
        onSave={() => void save()}
        label="Save changes"
        loadingLabel="Saving…"
      />
    </FinanceFormShell>
  );
}

export function FinanceInsuranceEditForm({
  id,
  initial,
}: {
  id: string;
  initial: {
    providerName: string;
    name: string;
    slug: string;
    premium?: number | string | null;
    affiliateUrl?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  };
}) {
  const router = useRouter();
  const [providerName, setProviderName] = useState(initial.providerName);
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [premium, setPremium] = useState(initial.premium != null ? String(initial.premium) : '');
  const [affiliateUrl, setAffiliateUrl] = useState(initial.affiliateUrl ?? '');
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/finance/insurance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName,
          name,
          slug,
          premium: premium ? Number(premium) : undefined,
          affiliateUrl: affiliateUrl || undefined,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
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
    <FinanceFormShell title="Edit insurance product" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <input
          className={inputClass}
          placeholder="Provider"
          value={providerName}
          onChange={(e) => setProviderName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Premium"
          value={premium}
          onChange={(e) => setPremium(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Affiliate URL"
          value={affiliateUrl}
          onChange={(e) => setAffiliateUrl(e.target.value)}
        />
      </div>
      <FinanceSeoFields
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        onSeoTitleChange={setSeoTitle}
        onSeoDescriptionChange={setSeoDescription}
      />
      <FormActions
        loading={loading}
        disabled={!name || !providerName}
        onSave={() => void save()}
        label="Save changes"
        loadingLabel="Saving…"
      />
    </FinanceFormShell>
  );
}

export function FinanceInvestmentEditForm({
  id,
  initial,
}: {
  id: string;
  initial: {
    providerName: string;
    name: string;
    slug: string;
    expectedReturn?: number | string | null;
    riskLevel?: string | null;
    affiliateUrl?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  };
}) {
  const router = useRouter();
  const [providerName, setProviderName] = useState(initial.providerName);
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [expectedReturn, setExpectedReturn] = useState(
    initial.expectedReturn != null ? String(initial.expectedReturn) : '',
  );
  const [riskLevel, setRiskLevel] = useState(initial.riskLevel ?? '');
  const [affiliateUrl, setAffiliateUrl] = useState(initial.affiliateUrl ?? '');
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/finance/investments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName,
          name,
          slug,
          expectedReturn: expectedReturn ? Number(expectedReturn) : undefined,
          riskLevel: riskLevel || undefined,
          affiliateUrl: affiliateUrl || undefined,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
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
    <FinanceFormShell title="Edit investment product" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <input
          className={inputClass}
          placeholder="Provider"
          value={providerName}
          onChange={(e) => setProviderName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Expected return (%)"
          value={expectedReturn}
          onChange={(e) => setExpectedReturn(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Risk level"
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Affiliate URL"
          value={affiliateUrl}
          onChange={(e) => setAffiliateUrl(e.target.value)}
        />
      </div>
      <FinanceSeoFields
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        onSeoTitleChange={setSeoTitle}
        onSeoDescriptionChange={setSeoDescription}
      />
      <FormActions
        loading={loading}
        disabled={!name || !providerName}
        onSave={() => void save()}
        label="Save changes"
        loadingLabel="Saving…"
      />
    </FinanceFormShell>
  );
}

export function FinanceFaqForm({
  categories = [],
}: {
  categories?: Array<{ id: string; name: string; slug: string }>;
}) {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [entityType, setEntityType] = useState('loan_hub');
  const [categoryId, setCategoryId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/finance/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          answer,
          entityType: entityType || null,
          categoryId: entityType === 'loan_category' && categoryId ? categoryId : undefined,
          entityId: entityType === 'loan_category' && categoryId ? categoryId : undefined,
          status: 'PUBLISHED',
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setQuestion('');
      setAnswer('');
      setEntityType('loan_hub');
      setCategoryId('');
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
        <input
          className={inputClass}
          placeholder="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <textarea
          className={`${inputClass} min-h-24 py-2`}
          placeholder="Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Show on</span>
          <select
            className={inputClass}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          >
            <option value="loan_hub">Loan hub (/finance/loans)</option>
            <option value="">General finance FAQs</option>
            <option value="loan_category">Loan category page</option>
            <option value="calculator">Calculator</option>
            <option value="article">Article</option>
          </select>
        </label>
        {entityType === 'loan_category' ? (
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Loan category</span>
            <select
              className={inputClass}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <FormActions
        loading={loading}
        disabled={!question || !answer || (entityType === 'loan_category' && !categoryId)}
        onSave={() => void save()}
      />
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
        <input
          className={inputClass}
          placeholder="Term"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <textarea
          className={`${inputClass} min-h-20 py-2 md:col-span-2`}
          placeholder="Definition"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
        />
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
          ids: ids
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
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
        <input
          className={inputClass}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Product IDs (comma-separated)"
          value={ids}
          onChange={(e) => setIds(e.target.value)}
        />
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
        <input
          className={inputClass}
          placeholder="Feed name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className={inputClass}
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          <option value="http-json">HTTP JSON feed</option>
          <option value="mock">Mock (demo)</option>
        </select>
        <input
          className={inputClass}
          placeholder="Endpoint URL (JSON rates array)"
          value={endpointUrl}
          onChange={(e) => setEndpointUrl(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Product type"
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
        />
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
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={loading}
      onClick={() => void syncNow()}
    >
      {loading ? 'Syncing…' : 'Sync now'}
    </Button>
  );
}

export function FinanceCategoryForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/finance/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          description: description || undefined,
          sortOrder: Number(sortOrder) || 0,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setName('');
      setSlug('');
      setDescription('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="New category" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <input
          className={inputClass}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Sort order"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <FormActions loading={loading} disabled={!name} onSave={() => void save()} />
    </FinanceFormShell>
  );
}

export function FinanceCategoryEditForm({
  id,
  initial,
}: {
  id: string;
  initial: {
    name: string;
    slug: string;
    description?: string | null;
    shortDescription?: string | null;
    introduction?: string | null;
    sortOrder?: number | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    contentSections?: Record<string, unknown> | null;
    relatedCalculatorSlugs?: string | null;
    relatedGuideSlugs?: string | null;
    icon?: string | null;
    iconMediaId?: string | null;
    iconAlt?: string | null;
    featuredImage?: string | null;
    featuredImageMediaId?: string | null;
    featuredImageAlt?: string | null;
    heroImage?: string | null;
    heroImageMediaId?: string | null;
    heroImageAlt?: string | null;
    loanHubEnabled?: boolean | null;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [description, setDescription] = useState(initial.description ?? '');
  const [shortDescription, setShortDescription] = useState(initial.shortDescription ?? '');
  const [introduction, setIntroduction] = useState(initial.introduction ?? '');
  const [sortOrder, setSortOrder] = useState(String(initial.sortOrder ?? 0));
  const [loanHubEnabled, setLoanHubEnabled] = useState(Boolean(initial.loanHubEnabled));
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle ?? initial.metaTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(
    initial.seoDescription ?? initial.metaDescription ?? '',
  );
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription ?? '');
  const existingSections =
    initial.contentSections && typeof initial.contentSections === 'object'
      ? (initial.contentSections as Record<string, unknown>)
      : {};
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const [key, value] of Object.entries(existingSections)) {
      if (
        key === 'relatedCalculatorSlugs' ||
        key === 'relatedGuideSlugs' ||
        key === 'governmentSchemes'
      ) {
        continue;
      }
      if (typeof value === 'string') next[key] = value;
    }
    return next;
  });
  const [relatedCalculatorSlugs, setRelatedCalculatorSlugs] = useState(
    initial.relatedCalculatorSlugs ??
      (Array.isArray(existingSections.relatedCalculatorSlugs)
        ? (existingSections.relatedCalculatorSlugs as string[]).join(', ')
        : ''),
  );
  const [relatedGuideSlugs, setRelatedGuideSlugs] = useState(
    initial.relatedGuideSlugs ??
      (Array.isArray(existingSections.relatedGuideSlugs)
        ? (existingSections.relatedGuideSlugs as string[]).join(', ')
        : ''),
  );
  const [governmentSchemesJson, setGovernmentSchemesJson] = useState(() => {
    const raw = existingSections.governmentSchemes;
    if (!raw) return '';
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return '';
    }
  });
  const isEducationLoanCategory = initial.slug === 'education-loan';
  const isBusinessLoanCategory = initial.slug === 'business-loan';
  const isGoldLoanCategory = initial.slug === 'gold-loan';
  const isLapCategory = initial.slug === 'loan-against-property';
  const supportsGovernmentSchemes =
    isEducationLoanCategory || isBusinessLoanCategory || isGoldLoanCategory || isLapCategory;
  const [icon, setIcon] = useState<EntityMediaValue>({
    mediaId: initial.iconMediaId ?? null,
    url: initial.icon ?? null,
    alt: initial.iconAlt ?? '',
  });
  const [cardImage, setCardImage] = useState<EntityMediaValue>({
    mediaId: initial.featuredImageMediaId ?? null,
    url: initial.featuredImage ?? null,
    alt: initial.featuredImageAlt ?? '',
  });
  const [heroImage, setHeroImage] = useState<EntityMediaValue>({
    mediaId: initial.heroImageMediaId ?? null,
    url: initial.heroImage ?? null,
    alt: initial.heroImageAlt ?? '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sectionKeys = [
    'whatIs',
    'howItWorks',
    'interestRates',
    'rateFactors',
    'eligibility',
    'creditScore',
    'documents',
    'fees',
    'emiCalculation',
    'tenure',
    'prepayment',
    'securedVsUnsecured',
    'alternatives',
    'vsLap',
    'advantages',
    'mistakes',
    'howToApply',
  ] as const;

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const contentSections: Record<string, unknown> = { ...existingSections };
      for (const key of sectionKeys) {
        const value = sectionDrafts[key]?.trim();
        contentSections[key] = value || null;
      }
      contentSections.relatedCalculatorSlugs = relatedCalculatorSlugs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      contentSections.relatedGuideSlugs = relatedGuideSlugs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (supportsGovernmentSchemes) {
        const trimmed = governmentSchemesJson.trim();
        if (!trimmed) {
          contentSections.governmentSchemes = null;
        } else {
          const parsed = JSON.parse(trimmed) as unknown;
          if (!Array.isArray(parsed)) {
            throw new Error('governmentSchemes must be a JSON array');
          }
          const reviewSoonMs = 180 * 24 * 60 * 60 * 1000;
          const now = Date.now();
          const staleNames: string[] = [];
          for (const item of parsed) {
            if (!item || typeof item !== 'object') {
              throw new Error('Each government scheme must be an object');
            }
            const row = item as Record<string, unknown>;
            if (typeof row.officialSourceUrl !== 'string' || !row.officialSourceUrl.trim()) {
              throw new Error('Each government scheme requires officialSourceUrl');
            }
            if (typeof row.lastVerifiedAt !== 'string' || !row.lastVerifiedAt.trim()) {
              throw new Error('Each government scheme requires lastVerifiedAt');
            }
            const verified = new Date(row.lastVerifiedAt).getTime();
            if (Number.isFinite(verified) && now - verified > reviewSoonMs) {
              staleNames.push(
                typeof row.name === 'string' ? row.name : String(row.slug ?? 'scheme'),
              );
            }
          }
          if (staleNames.length) {
            const proceed = window.confirm(
              `Needs Review: lastVerifiedAt is older than 180 days for: ${staleNames.join(', ')}. Save anyway? Re-verify official sources before relying on public thresholds.`,
            );
            if (!proceed) return;
          }
          contentSections.governmentSchemes = parsed;
        }
      }

      const [catRes, seoRes] = await Promise.all([
        fetch(`/api/admin/finance/categories/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            slug,
            description: description || undefined,
            shortDescription: shortDescription || null,
            introduction: introduction || null,
            sortOrder: Number(sortOrder) || 0,
            loanHubEnabled,
            metaTitle: metaTitle || null,
            metaDescription: metaDescription || null,
            contentSections,
            icon: icon.url || null,
            iconMediaId: icon.mediaId || null,
            iconAlt: icon.alt || null,
            featuredImage: cardImage.url || null,
            featuredImageMediaId: cardImage.mediaId || null,
            featuredImageAlt: cardImage.alt || null,
            heroImage: heroImage.url || null,
            heroImageMediaId: heroImage.mediaId || null,
            heroImageAlt: heroImage.alt || null,
          }),
        }),
        fetch(`/api/admin/seo/metadata/finance_category/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: seoTitle || metaTitle || null,
            description: seoDescription || metaDescription || null,
          }),
        }),
      ]);
      const catJson = (await catRes.json()) as { error?: { message?: string } };
      if (!catRes.ok) throw new Error(catJson.error?.message || 'Failed');
      if (!seoRes.ok) {
        const seoJson = (await seoRes.json()) as { error?: { message?: string } };
        throw new Error(seoJson.error?.message || 'SEO save failed');
      }
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="Edit category" message={message}>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className={inputClass}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Sort order"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={loanHubEnabled}
            onChange={(e) => setLoanHubEnabled(e.target.checked)}
          />
          Show on loan hub / category routes
        </label>
        <textarea
          className={`${inputClass} min-h-20 py-2 md:col-span-2`}
          placeholder="Short description (cards)"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
        />
        <textarea
          className={`${inputClass} min-h-24 py-2 md:col-span-2`}
          placeholder="Category intro (H1 supporting copy on /finance/loans/{slug})"
          value={introduction}
          onChange={(e) => setIntroduction(e.target.value)}
        />
        <textarea
          className={`${inputClass} min-h-24 py-2 md:col-span-2`}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <EntityMediaField
          label="Category icon"
          help="Small icon for tabs and compact UI."
          value={icon}
          onChange={setIcon}
        />
        <EntityMediaField
          label="Card illustration"
          help="Used on Popular Loan Categories cards."
          value={cardImage}
          onChange={setCardImage}
          showTitle
        />
        <EntityMediaField
          label="Category hero image"
          help="Hero for /finance/loans/{slug}."
          value={heroImage}
          onChange={setHeroImage}
          showCaption
          showTitle
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[var(--varnarc-ink)]">Category page SEO</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className={inputClass}
            placeholder="Meta title (category page)"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Meta description (category page)"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </div>
      </div>
      <FinanceSeoFields
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        onSeoTitleChange={setSeoTitle}
        onSeoDescriptionChange={setSeoDescription}
      />
      <div className="space-y-3">
        <p className="text-sm font-semibold text-[var(--varnarc-ink)]">
          Educational sections (override defaults when filled)
        </p>
        {sectionKeys.map((key) => (
          <label key={key} className="block text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">{key}</span>
            <textarea
              className={`${inputClass} min-h-20 py-2`}
              value={sectionDrafts[key] ?? ''}
              onChange={(e) => setSectionDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={`CMS override for ${key}`}
            />
          </label>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">
            Related calculator slugs (comma-separated)
          </span>
          <input
            className={inputClass}
            value={relatedCalculatorSlugs}
            onChange={(e) => setRelatedCalculatorSlugs(e.target.value)}
            placeholder="personal-loan-emi, loan-eligibility"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">
            Related guide slugs (comma-separated)
          </span>
          <input
            className={inputClass}
            value={relatedGuideSlugs}
            onChange={(e) => setRelatedGuideSlugs(e.target.value)}
            placeholder="how-to-choose-a-personal-loan"
          />
        </label>
      </div>
      {supportsGovernmentSchemes ? (
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">
            {isBusinessLoanCategory
              ? 'Business Loans → Government / MSME Schemes (JSON). Requires officialSourceUrl + lastVerifiedAt per scheme before publish.'
              : isGoldLoanCategory
                ? 'Gold Loans → Regulatory / RBI Information (JSON). Requires officialSourceUrl + lastVerifiedAt. Do not invent numerical LTV caps without verified sources.'
                : isLapCategory
                  ? 'Loan Against Property → Regulatory / RBI Information (JSON). Requires officialSourceUrl + lastVerifiedAt. Do not invent LTV caps, valuation rules or recovery timelines without verified sources.'
                  : 'Education Loans → Government Schemes (JSON). Requires officialSourceUrl + lastVerifiedAt per scheme before publish.'}
          </span>
          <textarea
            className={`${inputClass} min-h-48 py-2 font-mono text-xs`}
            value={governmentSchemesJson}
            onChange={(e) => setGovernmentSchemesJson(e.target.value)}
            placeholder='[{"id":"…","name":"PM-Vidyalaxmi","slug":"pm-vidyalaxmi","officialSourceUrl":"https://…","lastVerifiedAt":"2026-08-17","schemeType":"loan_portal",…}]'
          />
          <span className="mt-1 block text-xs text-[var(--varnarc-subtle)]">
            Leave empty to use published defaults. Prefer overview, eligibility, benefit,
            income/loan limits, institution/admission/course rules, subvention, moratorium,
            collateral/guarantee, official links, and verification fields. Do not publish without
            official source URLs. Re-set lastVerifiedAt on every material update. Saving with
            lastVerifiedAt older than 180 days prompts a Needs Review confirmation.
          </span>
        </label>
      ) : null}
      <FormActions
        loading={loading}
        disabled={!name}
        onSave={() => void save()}
        label="Save changes"
        loadingLabel="Saving…"
      />
    </FinanceFormShell>
  );
}

export function FinanceGuideForm({
  categories,
}: {
  categories: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/finance/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || slugify(title),
          summary: summary || undefined,
          body: body || undefined,
          categoryId: categoryId || undefined,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          status: 'PUBLISHED',
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setTitle('');
      setSlug('');
      setSummary('');
      setBody('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FinanceFormShell title="New guide" message={message}>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className={inputClass}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        {categories.length ? (
          <select
            className={inputClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : null}
        <input
          className={inputClass}
          placeholder="Summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>
      <textarea
        className={`${inputClass} min-h-32 py-2`}
        placeholder="Body content"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <FinanceSeoFields
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        onSeoTitleChange={setSeoTitle}
        onSeoDescriptionChange={setSeoDescription}
      />
      <FormActions loading={loading} disabled={!title} onSave={() => void save()} />
    </FinanceFormShell>
  );
}

export function FinanceGuideEditForm({
  id,
  categories,
  initial,
}: {
  id: string;
  categories: Array<{ id: string; name: string }>;
  initial: {
    title: string;
    slug: string;
    summary?: string | null;
    body?: string | null;
    categoryId?: string | null;
    status: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [summary, setSummary] = useState(initial.summary ?? '');
  const [body, setBody] = useState(initial.body ?? '');
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? '');
  const [status, setStatus] = useState(initial.status);
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/finance/guides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          summary: summary || null,
          body: body || null,
          categoryId: categoryId || null,
          status,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
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
    <FinanceFormShell title="Edit guide" message={message}>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className={inputClass}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        {categories.length ? (
          <select
            className={inputClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : null}
        <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
        <input
          className={inputClass}
          placeholder="Summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>
      <textarea
        className={`${inputClass} min-h-32 py-2`}
        placeholder="Body content"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <FinanceSeoFields
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        onSeoTitleChange={setSeoTitle}
        onSeoDescriptionChange={setSeoDescription}
      />
      <FormActions
        loading={loading}
        disabled={!title}
        onSave={() => void save()}
        label="Save changes"
        loadingLabel="Saving…"
      />
    </FinanceFormShell>
  );
}

export function FinancePageSeoEditor({
  pageKey,
  initial,
}: {
  pageKey: string;
  initial: {
    label: string;
    path: string;
    title: string;
    description: string;
    h1: string;
    intro: string;
    heroImageUrl?: string | null;
    heroImageMediaId?: string | null;
    heroImageAlt?: string | null;
    metaKeywords?: string | null;
    canonicalUrl?: string | null;
    educationModules?: Record<
      string,
      { title?: string; summary?: string; guideHref?: string | null }
    > | null;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [h1, setH1] = useState(initial.h1);
  const [intro, setIntro] = useState(initial.intro);
  const [hero, setHero] = useState<EntityMediaValue>({
    mediaId: initial.heroImageMediaId ?? null,
    url: initial.heroImageUrl ?? null,
    alt: initial.heroImageAlt ?? '',
  });
  const [metaKeywords, setMetaKeywords] = useState(initial.metaKeywords ?? '');
  const [canonicalUrl, setCanonicalUrl] = useState(initial.canonicalUrl ?? initial.path);
  const [educationModulesJson, setEducationModulesJson] = useState(
    initial.educationModules ? JSON.stringify(initial.educationModules, null, 2) : '',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      let educationModules:
        | Record<string, { title?: string; summary?: string; guideHref?: string | null }>
        | null
        | undefined;
      if (pageKey === 'loans') {
        const trimmed = educationModulesJson.trim();
        if (!trimmed) {
          educationModules = null;
        } else {
          educationModules = JSON.parse(trimmed) as Record<
            string,
            { title?: string; summary?: string; guideHref?: string | null }
          >;
        }
      }

      const res = await fetch(`/api/admin/finance/pages/${pageKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          description: description || null,
          h1: h1 || null,
          intro: intro || null,
          heroImageUrl: hero.url || null,
          heroImageMediaId: hero.mediaId || null,
          heroImageAlt: hero.alt || null,
          metaKeywords: metaKeywords || null,
          canonicalUrl: canonicalUrl || null,
          ...(pageKey === 'loans' ? { educationModules } : {}),
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
    <div className="mb-6 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{initial.label}</h3>
          <p className="font-mono text-xs text-[var(--varnarc-subtle)]">{initial.path}</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className={inputClass}
          placeholder="Meta title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Canonical URL"
          value={canonicalUrl}
          onChange={(e) => setCanonicalUrl(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Page H1"
          value={h1}
          onChange={(e) => setH1(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Meta keywords"
          value={metaKeywords}
          onChange={(e) => setMetaKeywords(e.target.value)}
        />
        <input
          className={`${inputClass} md:col-span-2`}
          placeholder="Meta description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className={`${inputClass} md:col-span-2`}
          placeholder="Page intro / subtitle"
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
        />
        <div className="md:col-span-2">
          <EntityMediaField
            label="Hub hero image"
            help="Displayed on the public hub hero. Prefer media library assets over hardcoded paths."
            value={hero}
            onChange={setHero}
            showTitle
          />
        </div>
        {pageKey === 'loans' ? (
          <label className="md:col-span-2 block space-y-1.5">
            <span className="text-xs font-semibold text-[var(--varnarc-subtle)]">
              Education modules JSON (optional overrides: title, summary, guideHref per module id)
            </span>
            <textarea
              className={`${inputClass} min-h-36 font-mono text-xs`}
              placeholder={`{\n  "typesOfLoans": { "title": "…", "summary": "…", "guideHref": "/finance/guides" }\n}`}
              value={educationModulesJson}
              onChange={(e) => setEducationModulesJson(e.target.value)}
            />
          </label>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button type="button" disabled={loading} onClick={() => void save()}>
          {loading ? 'Saving…' : 'Save page SEO'}
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
