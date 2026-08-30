/** Material price alerts — conditions, freshness gate, cooldown / dedupe helpers. */

import {
  isReliableCurrentPrice,
  resolveDisplayFreshness,
  type PriceFreshness,
} from '../prices-hub';

export const PRICE_ALERT_MAX_PER_USER = 25;
/** Default hours between notifications for the same alert. */
export const PRICE_ALERT_DEFAULT_COOLDOWN_HOURS = 24;
/** Minimum cooldown hours. */
export const PRICE_ALERT_MIN_COOLDOWN_HOURS = 1;
/** Maximum cooldown hours (30 days). */
export const PRICE_ALERT_MAX_COOLDOWN_HOURS = 24 * 30;

export const PRICE_ALERT_CONDITIONS = [
  {
    key: 'BELOW',
    label: 'Price below X',
    description: 'Notify when the observed price is at or below your target.',
    unit: 'price' as const,
  },
  {
    key: 'ABOVE',
    label: 'Price above X',
    description: 'Notify when the observed price is at or above your target.',
    unit: 'price' as const,
  },
  {
    key: 'DROP_PCT',
    label: 'Drops by X%',
    description:
      'Notify when the price falls by at least X% from the baseline captured at alert creation.',
    unit: 'percent' as const,
  },
  {
    key: 'RISE_PCT',
    label: 'Rises by X%',
    description:
      'Notify when the price rises by at least X% from the baseline captured at alert creation.',
    unit: 'percent' as const,
  },
] as const;

export type PriceAlertCondition = (typeof PRICE_ALERT_CONDITIONS)[number]['key'];

export function isPriceAlertCondition(value: string): value is PriceAlertCondition {
  return PRICE_ALERT_CONDITIONS.some((c) => c.key === value);
}

export function getPriceAlertCondition(key: string) {
  return PRICE_ALERT_CONDITIONS.find((c) => c.key === key);
}

export function evaluatePriceAlertCondition(input: {
  condition: PriceAlertCondition;
  observedPrice: number;
  targetPrice?: number | null;
  thresholdPercent?: number | null;
  baselinePrice?: number | null;
}): { triggered: boolean; changePercent: number | null; reason: string } {
  const price = input.observedPrice;
  if (!Number.isFinite(price) || price <= 0) {
    return { triggered: false, changePercent: null, reason: 'invalid_observed_price' };
  }

  if (input.condition === 'BELOW') {
    const target = input.targetPrice;
    if (target == null || !Number.isFinite(target)) {
      return { triggered: false, changePercent: null, reason: 'missing_target' };
    }
    return {
      triggered: price <= target,
      changePercent: null,
      reason: price <= target ? 'price_at_or_below_target' : 'price_above_target',
    };
  }

  if (input.condition === 'ABOVE') {
    const target = input.targetPrice;
    if (target == null || !Number.isFinite(target)) {
      return { triggered: false, changePercent: null, reason: 'missing_target' };
    }
    return {
      triggered: price >= target,
      changePercent: null,
      reason: price >= target ? 'price_at_or_above_target' : 'price_below_target',
    };
  }

  const baseline = input.baselinePrice;
  const pct = input.thresholdPercent;
  if (baseline == null || !Number.isFinite(baseline) || baseline <= 0) {
    return { triggered: false, changePercent: null, reason: 'missing_baseline' };
  }
  if (pct == null || !Number.isFinite(pct) || pct <= 0) {
    return { triggered: false, changePercent: null, reason: 'missing_percent' };
  }

  const changePercent = ((price - baseline) / baseline) * 100;
  if (input.condition === 'DROP_PCT') {
    const drop = -changePercent;
    return {
      triggered: drop >= pct,
      changePercent: Math.round(changePercent * 10) / 10,
      reason: drop >= pct ? 'drop_threshold_met' : 'drop_insufficient',
    };
  }

  // RISE_PCT
  return {
    triggered: changePercent >= pct,
    changePercent: Math.round(changePercent * 10) / 10,
    reason: changePercent >= pct ? 'rise_threshold_met' : 'rise_insufficient',
  };
}

/** Alerts may only fire on LIVE/VERIFIED observations within the current freshness window. */
export function isPriceFreshEnoughForAlert(input: {
  claimed: PriceFreshness;
  verifiedAt?: Date | string | null;
  effectiveFrom?: Date | string | null;
  now?: Date;
}): boolean {
  return isReliableCurrentPrice(
    resolveDisplayFreshness({
      claimed: input.claimed,
      verifiedAt: input.verifiedAt,
      effectiveFrom: input.effectiveFrom,
      now: input.now,
    }),
  );
}

/**
 * Duplicate-notification prevention: respect cooldown and identical observed price.
 */
export function shouldSuppressAlertNotification(input: {
  lastTriggeredAt?: Date | string | null;
  lastNotifiedPrice?: number | null;
  observedPrice: number;
  cooldownHours: number;
  now?: Date;
}): { suppress: boolean; reason: string | null } {
  const now = input.now ?? new Date();
  const cooldownMs =
    Math.min(
      Math.max(input.cooldownHours, PRICE_ALERT_MIN_COOLDOWN_HOURS),
      PRICE_ALERT_MAX_COOLDOWN_HOURS,
    ) *
    60 *
    60 *
    1000;

  if (input.lastTriggeredAt) {
    const last = new Date(input.lastTriggeredAt);
    if (!Number.isNaN(last.getTime()) && now.getTime() - last.getTime() < cooldownMs) {
      const samePrice =
        input.lastNotifiedPrice != null &&
        Math.abs(input.lastNotifiedPrice - input.observedPrice) < 0.005;
      return {
        suppress: true,
        reason: samePrice ? 'cooldown_same_price' : 'cooldown_active',
      };
    }
  }

  return { suppress: false, reason: null };
}

export const PRICE_ALERT_QUALIFICATION =
  'Alerts use Varnarc observed/reference prices with freshness checks. Local dealer quotes can differ. Alerts are not financial advice and delivery depends on your notification settings.';
