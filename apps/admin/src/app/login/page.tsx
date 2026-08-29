import { Suspense } from 'react';
import { AdminLoginForm } from '@/components/admin-login-form';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--varnarc-muted)] px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--varnarc-brand)]">Varnarc Admin</h1>
        <p className="mt-1 text-sm text-[var(--varnarc-subtle)]">
          Super admin: business@varnarc.com
        </p>
        <div className="mt-6">
          <Suspense>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
