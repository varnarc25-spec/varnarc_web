import { describe, expect, it } from 'vitest';

import {
  evaluatePriceAlertCondition,
  isPriceFreshEnoughForAlert,
  shouldSuppressAlertNotification,
} from '../src/price-alerts';

describe('evaluatePriceAlertCondition', () => {
  it('handles below/above absolute targets', () => {
    expect(
      evaluatePriceAlertCondition({
        condition: 'BELOW',
        observedPrice: 350,
        targetPrice: 400,
      }).triggered,
    ).toBe(true);
    expect(
      evaluatePriceAlertCondition({
        condition: 'ABOVE',
        observedPrice: 350,
        targetPrice: 400,
      }).triggered,
    ).toBe(false);
  });

  it('handles percent drop/rise vs baseline', () => {
    const drop = evaluatePriceAlertCondition({
      condition: 'DROP_PCT',
      observedPrice: 80,
      baselinePrice: 100,
      thresholdPercent: 15,
    });
    expect(drop.triggered).toBe(true);
    expect(drop.changePercent).toBe(-20);

    const rise = evaluatePriceAlertCondition({
      condition: 'RISE_PCT',
      observedPrice: 120,
      baselinePrice: 100,
      thresholdPercent: 15,
    });
    expect(rise.triggered).toBe(true);
  });
});

describe('freshness gate', () => {
  const now = new Date('2026-08-21T00:00:00.000Z');

  it('allows fresh LIVE/VERIFIED only', () => {
    expect(
      isPriceFreshEnoughForAlert({
        claimed: 'LIVE',
        verifiedAt: '2026-08-10T00:00:00.000Z',
        now,
      }),
    ).toBe(true);
    expect(
      isPriceFreshEnoughForAlert({
        claimed: 'ESTIMATED',
        effectiveFrom: '2026-08-10T00:00:00.000Z',
        now,
      }),
    ).toBe(false);
    expect(
      isPriceFreshEnoughForAlert({
        claimed: 'LIVE',
        verifiedAt: '2026-06-01T00:00:00.000Z',
        now,
      }),
    ).toBe(false);
  });
});

describe('duplicate notification prevention', () => {
  const now = new Date('2026-08-21T12:00:00.000Z');

  it('suppresses within cooldown', () => {
    const r = shouldSuppressAlertNotification({
      lastTriggeredAt: '2026-08-21T06:00:00.000Z',
      lastNotifiedPrice: 400,
      observedPrice: 390,
      cooldownHours: 24,
      now,
    });
    expect(r.suppress).toBe(true);
  });

  it('allows after cooldown', () => {
    const r = shouldSuppressAlertNotification({
      lastTriggeredAt: '2026-08-19T00:00:00.000Z',
      lastNotifiedPrice: 400,
      observedPrice: 390,
      cooldownHours: 24,
      now,
    });
    expect(r.suppress).toBe(false);
  });
});
