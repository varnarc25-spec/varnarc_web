'use client';

import { useState, type ReactNode } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@varnarc/ui';

export type AiProvider = {
  slug: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  imageModel?: string;
  apiKeyEnvVar: string;
  priority: number;
  isDefault: boolean;
  isEnabled: boolean;
  keyConfigured?: boolean;
  apiKeyConfigured?: boolean;
};

const emptyProvider: AiProvider = {
  slug: '',
  name: '',
  baseUrl: '',
  defaultModel: '',
  imageModel: '',
  apiKeyEnvVar: '',
  priority: 100,
  isDefault: false,
  isEnabled: true,
};

function errorMessage(value: unknown, fallback: string) {
  if (
    value &&
    typeof value === 'object' &&
    'error' in value &&
    value.error &&
    typeof value.error === 'object' &&
    'message' in value.error &&
    typeof value.error.message === 'string'
  ) {
    return value.error.message;
  }
  return fallback;
}

export function ProviderManagement({ providers }: { providers: AiProvider[] }) {
  const [editing, setEditing] = useState<AiProvider | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function mutate(path: string, method: string, body?: unknown) {
    setBusy(path);
    setMessage(null);
    try {
      const response = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const json = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) throw new Error(errorMessage(json, `Request failed (${response.status})`));
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed');
      setBusy(null);
    }
  }

  function remove(provider: AiProvider) {
    if (
      window.confirm(
        `Delete ${provider.name}? This removes its configuration, but does not delete its Cloud Run secret.`,
      )
    ) {
      void mutate(`/api/admin/ai-ops/providers/${encodeURIComponent(provider.slug)}`, 'DELETE');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl space-y-1 text-sm text-[var(--varnarc-subtle)]">
          <p>
            API keys remain in Google Secret Manager and are exposed only to the API service through
            Cloud Run environment variables.
          </p>
          <p>
            <code className="rounded bg-[var(--varnarc-muted)] px-1">apiKeyEnvVar</code> stores only
            the environment variable name that references a secret. Raw keys are never stored or
            shown here.
          </p>
        </div>
        <Button type="button" onClick={() => setCreating(true)}>
          Add provider
        </Button>
      </div>

      {message ? <p className="text-sm text-red-600">{message}</p> : null}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Base URL</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Key environment variable</TableHead>
              <TableHead>Key status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((provider) => {
              const keyConfigured = provider.keyConfigured ?? provider.apiKeyConfigured;
              return (
                <TableRow key={provider.slug}>
                  <TableCell>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-xs text-[var(--varnarc-subtle)]">{provider.slug}</div>
                  </TableCell>
                  <TableCell className="max-w-64 break-all text-xs">{provider.baseUrl}</TableCell>
                  <TableCell>
                    <div>{provider.defaultModel}</div>
                    {provider.imageModel ? (
                      <div className="text-xs text-[var(--varnarc-subtle)]">
                        Image: {provider.imageModel}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{provider.apiKeyEnvVar}</code>
                  </TableCell>
                  <TableCell>
                    {keyConfigured === undefined ? (
                      <span className="text-xs text-[var(--varnarc-subtle)]">Not reported</span>
                    ) : (
                      <Badge
                        className={
                          keyConfigured
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }
                      >
                        {keyConfigured ? 'Configured' : 'Missing'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{provider.priority}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        provider.isEnabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-700'
                      }
                    >
                      {provider.isEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {provider.isDefault ? (
                      <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(provider)}
                      >
                        Edit
                      </Button>
                      {!provider.isDefault ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={busy !== null}
                          onClick={() =>
                            void mutate(
                              `/api/admin/ai-ops/providers/${encodeURIComponent(provider.slug)}/default`,
                              'POST',
                            )
                          }
                        >
                          Set default
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        disabled={busy !== null}
                        onClick={() => remove(provider)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ProviderDialog
        key={editing?.slug ?? (creating ? 'new' : 'closed')}
        open={creating || editing !== null}
        provider={editing ?? emptyProvider}
        isEditing={editing !== null}
        busy={busy !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={(provider) => {
          const path = editing
            ? `/api/admin/ai-ops/providers/${encodeURIComponent(editing.slug)}`
            : '/api/admin/ai-ops/providers';
          void mutate(path, editing ? 'PUT' : 'POST', provider);
        }}
      />
    </div>
  );
}

function ProviderDialog({
  open,
  provider,
  isEditing,
  busy,
  onClose,
  onSave,
}: {
  open: boolean;
  provider: AiProvider;
  isEditing: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (provider: AiProvider | Omit<AiProvider, 'slug'>) => void;
}) {
  const [form, setForm] = useState(provider);

  function update<K extends keyof AiProvider>(key: K, value: AiProvider[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogHeader>
        <DialogTitle>{isEditing ? `Edit ${provider.name}` : 'Add AI provider'}</DialogTitle>
        <DialogDescription>
          Enter a Secret Manager-backed environment variable name, never an API key.
        </DialogDescription>
      </DialogHeader>
      <form
        className="grid max-h-[70vh] gap-3 overflow-y-auto sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const {
            keyConfigured: _keyConfigured,
            apiKeyConfigured: _apiKeyConfigured,
            ...rawPayload
          } = form;
          const payload = {
            ...rawPayload,
            ...(rawPayload.imageModel ? { imageModel: rawPayload.imageModel } : {}),
          };
          if (!rawPayload.imageModel) delete payload.imageModel;
          onSave(isEditing ? (({ slug: _slug, ...rest }) => rest)(payload) : payload);
        }}
      >
        {!isEditing ? (
          <Field label="Slug">
            <Input
              required
              value={form.slug}
              onChange={(event) => update('slug', event.target.value)}
            />
          </Field>
        ) : null}
        <Field label="Name">
          <Input
            required
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
          />
        </Field>
        <Field label="Base URL" wide>
          <Input
            required
            type="url"
            value={form.baseUrl}
            onChange={(event) => update('baseUrl', event.target.value)}
          />
        </Field>
        <Field label="Default model">
          <Input
            required
            value={form.defaultModel}
            onChange={(event) => update('defaultModel', event.target.value)}
          />
        </Field>
        <Field label="Image model (optional)">
          <Input
            value={form.imageModel ?? ''}
            onChange={(event) => update('imageModel', event.target.value)}
          />
        </Field>
        <Field label="API key environment variable">
          <Input
            required
            pattern="[A-Z][A-Z0-9_]*"
            placeholder="OPENAI_API_KEY"
            autoComplete="off"
            value={form.apiKeyEnvVar}
            onChange={(event) => update('apiKeyEnvVar', event.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Priority">
          <Input
            required
            type="number"
            min={0}
            max={10000}
            value={form.priority}
            onChange={(event) => update('priority', Number(event.target.value))}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isEnabled}
            onChange={(event) => update('isEnabled', event.target.checked)}
          />
          Enabled
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(event) => update('isDefault', event.target.checked)}
          />
          Make default
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : isEditing ? 'Save changes' : 'Add provider'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function Field({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`space-y-1 text-sm ${wide ? 'sm:col-span-2' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
