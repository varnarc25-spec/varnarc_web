export function isNextControlFlowError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const digest = 'digest' in error ? String((error as { digest?: unknown }).digest ?? '') : '';
  return (
    digest.startsWith('NEXT_REDIRECT') ||
    digest.startsWith('NEXT_NOT_FOUND') ||
    digest === 'BAILOUT_TO_CLIENT_SIDE_RENDERING'
  );
}
