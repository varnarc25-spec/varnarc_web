'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AdminNavGroup } from '@/components/admin-nav-config';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupIsActive(group: AdminNavGroup, pathname: string): boolean {
  return group.items.some((item) => isActive(pathname, item.href));
}

const linkClass = (active: boolean) =>
  `block rounded-md px-3 py-1.5 text-sm transition ${
    active
      ? 'bg-[var(--varnarc-muted)] font-medium text-[var(--varnarc-brand)]'
      : 'text-[var(--varnarc-subtle)] hover:bg-[var(--varnarc-muted)] hover:text-[var(--varnarc-ink)]'
  }`;

export function AdminNavSidebar({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const group of groups) {
        if (groupIsActive(group, pathname)) {
          next[group.id] = true;
        }
      }
      return next;
    });
  }, [pathname, groups]);

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] md:block">
      <nav className="flex flex-col gap-0.5 p-3" aria-label="Admin navigation">
        {groups.map((group) => {
          const isDashboardOnly = group.id === 'overview' && group.items.length === 1;
          const dashboardItem = group.items[0];

          if (isDashboardOnly && dashboardItem) {
            return (
              <Link
                key={dashboardItem.href}
                href={dashboardItem.href}
                className={`${linkClass(isActive(pathname, dashboardItem.href))} py-2`}
              >
                {dashboardItem.label}
              </Link>
            );
          }

          const open = expanded[group.id] ?? false;
          const activeGroup = groupIsActive(group, pathname);

          return (
            <div key={group.id} className="py-0.5">
              <button
                type="button"
                onClick={() => toggle(group.id)}
                aria-expanded={open}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                  activeGroup
                    ? 'text-[var(--varnarc-brand)]'
                    : 'text-[var(--varnarc-ink)] hover:bg-[var(--varnarc-muted)]'
                }`}
              >
                <span>{group.label}</span>
                <span className="text-xs text-[var(--varnarc-subtle)]" aria-hidden>
                  {open ? '▾' : '▸'}
                </span>
              </button>
              {open ? (
                <div className="ml-2 mt-0.5 flex flex-col gap-0.5 border-l border-[var(--varnarc-border)] pl-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={linkClass(isActive(pathname, item.href))}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
