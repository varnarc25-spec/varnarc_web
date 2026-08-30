/** Small Levenshtein distance for typo tolerance (deterministic, no AI). */

export function levenshtein(a: string, b: string): number {
  const s = a.toLowerCase();
  const t = b.toLowerCase();
  if (s === t) return 0;
  if (!s.length) return t.length;
  if (!t.length) return s.length;

  const prev = new Array<number>(t.length + 1);
  const curr = new Array<number>(t.length + 1);
  for (let j = 0; j <= t.length; j++) prev[j] = j;

  for (let i = 1; i <= s.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      curr[j] = Math.min((prev[j] ?? 0) + 1, (curr[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    for (let j = 0; j <= t.length; j++) prev[j] = curr[j] ?? 0;
  }
  return prev[t.length] ?? t.length;
}

/** True when strings are close enough given length (typo-tolerant match). */
export function fuzzyEquals(a: string, b: string, maxDistance?: number): boolean {
  const s = a.trim().toLowerCase();
  const t = b.trim().toLowerCase();
  if (!s || !t) return false;
  if (s === t) return true;
  if (s.includes(t) || t.includes(s)) return true;
  const limit =
    maxDistance ??
    (Math.min(s.length, t.length) <= 4 ? 1 : Math.min(s.length, t.length) <= 8 ? 2 : 3);
  return levenshtein(s, t) <= limit;
}

export function bestFuzzyMatch(
  token: string,
  candidates: readonly string[],
  maxDistance?: number,
): string | null {
  const t = token.trim().toLowerCase();
  if (!t) return null;
  let best: string | null = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    const dist = levenshtein(t, c.toLowerCase());
    const limit =
      maxDistance ??
      (Math.min(t.length, c.length) <= 4 ? 1 : Math.min(t.length, c.length) <= 8 ? 2 : 3);
    if (dist <= limit && dist < bestDist) {
      best = c;
      bestDist = dist;
    }
  }
  return best;
}
