const URL_PATTERN = /https?:\/\/|www\./gi;
const BLOCKLIST = ['viagra', 'casino', 'crypto airdrop', 'click here now', 'buy followers'];

export type SpamScoreResult = {
  score: number;
  reasons: string[];
  shouldReview: boolean;
};

export function scoreCommentSpam(body: string): SpamScoreResult {
  const text = body.trim();
  const lower = text.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  const urlMatches = text.match(URL_PATTERN) ?? [];
  if (urlMatches.length >= 2) {
    score += 3;
    reasons.push('multiple_links');
  } else if (urlMatches.length === 1) {
    score += 1;
    reasons.push('contains_link');
  }

  if (text.length < 8) {
    score += 1;
    reasons.push('too_short');
  }

  if (/(.)\1{6,}/.test(text)) {
    score += 2;
    reasons.push('repeated_chars');
  }

  for (const term of BLOCKLIST) {
    if (lower.includes(term)) {
      score += 3;
      reasons.push(`blocklist:${term}`);
      break;
    }
  }

  if (/[A-Z]{12,}/.test(text)) {
    score += 1;
    reasons.push('excessive_caps');
  }

  return {
    score,
    reasons,
    shouldReview: score >= 2,
  };
}
