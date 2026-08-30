'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DOCUMENT_VAULT_CATEGORIES,
  DOCUMENT_VAULT_CATEGORY_LABELS,
  DOCUMENT_VAULT_QUALIFICATION,
  MAX_MEDIA_UPLOAD_BYTES,
  type DocumentVaultCategoryId,
} from '@varnarc/validation';
import { CalculatorShell } from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { cn, cx } from '@/components/construction/styles';
import type { ConstructionProject } from '@/services/construction';
import { DOCUMENT_VAULT_FAQS, DOCUMENT_VAULT_RELATED, DOCUMENT_VAULT_SEO } from './content';

type VaultDoc = {
  id: string;
  projectId: string;
  kind: string;
  title: string;
  notes?: string | null;
  originalFilename?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  boqId?: string | null;
  expenseId?: string | null;
  phaseId?: string | null;
  quoteDocumentId?: string | null;
  createdAt?: string;
  hasFile?: boolean;
};

type ViewMode = 'list' | 'grid';

function formatBytes(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function kindLabel(kind: string) {
  return DOCUMENT_VAULT_CATEGORY_LABELS[kind as DocumentVaultCategoryId] || kind.replace(/_/g, ' ');
}

export function DocumentVaultClient() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');

  const [projectId, setProjectId] = useState<string | null>(projectIdParam);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [boqs, setBoqs] = useState<Array<{ id: string; name: string }>>([]);
  const [expenses, setExpenses] = useState<Array<{ id: string; name: string }>>([]);
  const [phases, setPhases] = useState<Array<{ id: string; name: string }>>([]);
  const [filterKind, setFilterKind] = useState<string>('');
  const [view, setView] = useState<ViewMode>('grid');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<DocumentVaultCategoryId>('OTHER');
  const [notes, setNotes] = useState('');
  const [boqId, setBoqId] = useState('');
  const [expenseId, setExpenseId] = useState('');
  const [phaseId, setPhaseId] = useState('');
  const [quoteDocumentId, setQuoteDocumentId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quoteDocs = useMemo(() => docs.filter((d) => d.kind === 'QUOTE'), [docs]);

  const filtered = useMemo(() => {
    if (!filterKind) return docs;
    return docs.filter((d) => d.kind === filterKind);
  }, [docs, filterKind]);

  const loadProjectLinks = useCallback(async (pid: string) => {
    const res = await fetch(`/api/construction/projects/${pid}`, { cache: 'no-store' });
    if (!res.ok) return;
    const json = await res.json();
    const project = (json?.data ?? json) as ConstructionProject;
    setBoqs((project.boqs ?? []).map((b) => ({ id: b.id, name: b.name || 'BOQ' })));
    setExpenses((project.expenses ?? []).map((e) => ({ id: e.id, name: e.name || 'Expense' })));
    setPhases((project.phases ?? []).map((p) => ({ id: p.id, name: p.name })));
  }, []);

  const loadDocs = useCallback(async (pid: string, kindFilter?: string) => {
    const qs = kindFilter ? `?kind=${encodeURIComponent(kindFilter)}` : '';
    const res = await fetch(`/api/construction/projects/${pid}/documents${qs}`, {
      cache: 'no-store',
    });
    if (res.status === 401) {
      setError('Sign in to access the document vault.');
      return;
    }
    if (!res.ok) throw new Error('Could not load documents');
    const json = await res.json();
    const list = (json?.data ?? json ?? []) as VaultDoc[];
    setDocs(Array.isArray(list) ? list : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/construction/projects', { cache: 'no-store' });
        if (res.status === 401 || !res.ok) return;
        const json = await res.json();
        const list = (json?.data ?? json ?? []) as ConstructionProject[];
        if (cancelled || !Array.isArray(list)) return;
        setProjects(list.map((p) => ({ id: p.id, name: p.name || 'Untitled project' })));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projectId) {
      setDocs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        await loadDocs(projectId);
        await loadProjectLinks(projectId);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Load failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, loadDocs, loadProjectLinks]);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    setActionMsg(null);
    setError(null);
    if (!projectId) {
      setError('Select a project first.');
      return;
    }
    if (!file) {
      setError('Choose a file to upload.');
      return;
    }
    if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
      setError('File exceeds the 50 MB limit.');
      return;
    }
    if (!title.trim()) {
      setError('Enter a document title.');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title.trim());
      fd.append('kind', kind);
      if (notes.trim()) fd.append('notes', notes.trim());
      if (boqId) fd.append('boqId', boqId);
      if (expenseId) fd.append('expenseId', expenseId);
      if (phaseId) fd.append('phaseId', phaseId);
      if (quoteDocumentId) fd.append('quoteDocumentId', quoteDocumentId);

      const res = await fetch(`/api/construction/projects/${projectId}/documents`, {
        method: 'POST',
        body: fd,
      });
      if (res.status === 401) {
        setError('Sign in to upload documents.');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || 'Upload failed');
      }
      setTitle('');
      setNotes('');
      setFile(null);
      setBoqId('');
      setExpenseId('');
      setPhaseId('');
      setQuoteDocumentId('');
      setActionMsg('Document uploaded to the private vault.');
      await loadDocs(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  function openFile(doc: VaultDoc, disposition: 'inline' | 'attachment') {
    window.open(
      `/api/construction/documents/${doc.id}/file?disposition=${disposition}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  async function removeDoc(doc: VaultDoc) {
    if (!confirm(`Remove “${doc.title}” from the vault?`)) return;
    const res = await fetch(`/api/construction/documents/${doc.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Could not delete document.');
      return;
    }
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    setActionMsg('Document removed.');
  }

  const formNode = (
    <div className="space-y-5">
      <aside className="rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
        <p className="text-sm font-semibold text-[#0b1f3a]">Private project vault</p>
        <p className="mt-1 text-sm text-slate-700">{DOCUMENT_VAULT_QUALIFICATION}</p>
      </aside>

      <div className={cn(cx.card, 'space-y-3 p-4 sm:p-5')}>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Project</span>
          <select
            className={cx.input}
            value={projectId ?? ''}
            onChange={(e) => setProjectId(e.target.value || null)}
          >
            <option value="">Select project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <Link
          href="/construction/project/new"
          className="text-sm font-medium text-[#f97316] hover:underline"
        >
          Create a project
        </Link>
      </div>

      <form className={cn(cx.card, 'space-y-3 p-4 sm:p-5')} onSubmit={onUpload}>
        <h3 className="text-sm font-semibold text-[#0b1f3a]">Upload document</h3>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Category</span>
          <select
            className={cx.input}
            value={kind}
            onChange={(e) => setKind(e.target.value as DocumentVaultCategoryId)}
          >
            {DOCUMENT_VAULT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Title</span>
          <input
            className={cx.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ground floor plan — rev B"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">File</span>
          <input
            className={cx.input}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-xs text-slate-500">
            Max {Math.round(MAX_MEDIA_UPLOAD_BYTES / (1024 * 1024))} MB. Filename is sanitized on
            upload.
          </p>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Notes</span>
          <textarea
            className={cx.input}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Link to BOQ (optional)</span>
            <select className={cx.input} value={boqId} onChange={(e) => setBoqId(e.target.value)}>
              <option value="">None</option>
              {boqs.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Link to expense (optional)</span>
            <select
              className={cx.input}
              value={expenseId}
              onChange={(e) => setExpenseId(e.target.value)}
            >
              <option value="">None</option>
              {expenses.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Link to phase (optional)</span>
            <select
              className={cx.input}
              value={phaseId}
              onChange={(e) => setPhaseId(e.target.value)}
            >
              <option value="">None</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Link to quote (optional)</span>
            <select
              className={cx.input}
              value={quoteDocumentId}
              onChange={(e) => setQuoteDocumentId(e.target.value)}
            >
              <option value="">None</option>
              {quoteDocs.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className={cx.primaryBtn} disabled={loading || !projectId}>
          {loading ? 'Uploading…' : 'Upload to vault'}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {actionMsg ? <p className="text-sm text-slate-600">{actionMsg}</p> : null}
      </form>
    </div>
  );

  const resultNode = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <select
            className={cn(cx.input, 'w-auto min-w-[12rem]')}
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value)}
          >
            <option value="">All categories</option>
            {DOCUMENT_VAULT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          {(['grid', 'list'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-semibold capitalize',
                view === mode
                  ? 'bg-[#0b1f3a] text-white'
                  : 'border border-slate-200 bg-white text-[#0b1f3a]',
              )}
              onClick={() => setView(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {!projectId ? (
        <p className="text-sm text-slate-500">Select a project to browse its vault.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No documents in this filter yet.</p>
      ) : view === 'grid' ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((doc) => (
            <li key={doc.id} className={cn(cx.card, 'flex flex-col gap-2 p-4')}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#f97316]">
                {kindLabel(doc.kind)}
              </p>
              <p className="font-semibold text-[#0b1f3a]">{doc.title}</p>
              <p className="text-xs text-slate-500">
                {doc.originalFilename || 'File'} · {formatBytes(doc.sizeBytes)} ·{' '}
                {formatDate(doc.createdAt)}
              </p>
              {doc.notes ? (
                <p className="text-sm text-slate-600 line-clamp-2">{doc.notes}</p>
              ) : null}
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                {doc.hasFile ? (
                  <>
                    <button
                      type="button"
                      className={cx.secondaryBtn}
                      onClick={() => openFile(doc, 'inline')}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className={cx.primaryBtn}
                      onClick={() => openFile(doc, 'attachment')}
                    >
                      Download
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:underline"
                  onClick={() => void removeDoc(doc)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="py-2 pr-2">Title</th>
                <th className="py-2 pr-2">Category</th>
                <th className="py-2 pr-2">File</th>
                <th className="py-2 pr-2">Uploaded</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2">
                    <p className="font-medium text-[#0b1f3a]">{doc.title}</p>
                    {doc.notes ? (
                      <p className="text-xs text-slate-500 line-clamp-1">{doc.notes}</p>
                    ) : null}
                  </td>
                  <td className="py-2 pr-2">{kindLabel(doc.kind)}</td>
                  <td className="py-2 pr-2">
                    {doc.originalFilename || '—'}
                    <span className="block text-xs text-slate-500">
                      {formatBytes(doc.sizeBytes)}
                    </span>
                  </td>
                  <td className="py-2 pr-2">{formatDate(doc.createdAt)}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      {doc.hasFile ? (
                        <>
                          <button
                            type="button"
                            className="text-xs font-medium text-[#f97316] hover:underline"
                            onClick={() => openFile(doc, 'inline')}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="text-xs font-medium text-[#0b1f3a] hover:underline"
                            onClick={() => openFile(doc, 'attachment')}
                          >
                            Download
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        className="text-xs text-slate-500 hover:underline"
                        onClick={() => void removeDoc(doc)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Document vault' },
        ]}
        title="Construction Project Document Vault"
        description={DOCUMENT_VAULT_SEO}
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        faqs={DOCUMENT_VAULT_FAQS}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={DOCUMENT_VAULT_RELATED} />
      </div>
    </>
  );
}
