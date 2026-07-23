import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export function formatDate(value?: string | Date | null, pattern = 'dd MMM yyyy'): string | null {
  if (!value) return null;
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(date)) return null;
  return format(date, pattern);
}

export function formatRelative(value?: string | Date | null): string | null {
  if (!value) return null;
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(date)) return null;
  return formatDistanceToNow(date, { addSuffix: true });
}
