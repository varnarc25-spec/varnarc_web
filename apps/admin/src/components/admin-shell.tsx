import type { ReactNode } from 'react';
import { Shell } from '@varnarc/ui';
import type { CurrentUser } from '@varnarc/types';
import { hasPermission, isAdminRole, type Permission } from '@varnarc/auth';
import { ADMIN_NAV_GROUPS, type AdminNavGroup } from '@/components/admin-nav-config';
import { AdminNavSidebar } from '@/components/admin-nav-sidebar';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

function canSeeItem(
  permission: Permission | null,
  currentUser: CurrentUser | null,
): boolean {
  if (!permission) return true;
  if (!currentUser) return false;
  return hasPermission(currentUser.permissions, permission) || isAdminRole(currentUser.roles);
}

function filterNavGroups(currentUser: CurrentUser | null): AdminNavGroup[] {
  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSeeItem(item.permission, currentUser)),
  })).filter((group) => group.items.length > 0);
}

export function AdminShell({
  children,
  currentUser,
  sessionPicture,
}: {
  children: ReactNode;
  currentUser: CurrentUser | null;
  sessionPicture?: string | null;
}) {
  const navGroups = filterNavGroups(currentUser);

  const displayName = currentUser?.displayName || currentUser?.email || 'Admin user';
  const avatarUrl = currentUser?.avatarUrl || sessionPicture || null;

  return (
    <Shell
      widthClassName="w-[80%]"
      topbar={
        <div className="sticky top-0 z-20 border-b border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <div className="mx-auto flex h-14 w-[80%] items-center justify-between px-6">
            <div className="font-semibold text-[var(--varnarc-brand)]">Varnarc Admin</div>
            <div className="flex items-center gap-3 text-sm text-[var(--varnarc-subtle)]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-[var(--varnarc-border)]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--varnarc-brand)] text-xs font-semibold text-white">
                  {initials(displayName)}
                </span>
              )}
              <span>{displayName}</span>
              <a href="/auth/logout" className="text-[var(--varnarc-brand)] hover:underline">
                Logout
              </a>
            </div>
          </div>
        </div>
      }
      sidebar={<AdminNavSidebar groups={navGroups} />}
    >
      {children}
    </Shell>
  );
}
