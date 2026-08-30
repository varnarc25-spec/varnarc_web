import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import {
  PRICE_ALERT_DEFAULT_COOLDOWN_HOURS,
  PRICE_ALERT_MAX_PER_USER,
  PRICE_ALERT_QUALIFICATION,
  PRICE_ALERT_CONDITIONS,
  PRICE_HUB_CITIES,
  createConstructionPriceAlertSchema,
  evaluatePriceAlertCondition,
  getPriceAlertCondition,
  isPriceFreshEnoughForAlert,
  isPriceHubCitySlug,
  matchMaterialToHubKey,
  shouldSuppressAlertNotification,
  updateConstructionPriceAlertSchema,
  type CreateConstructionPriceAlertInput,
  type PriceAlertCondition,
  type UpdateConstructionPriceAlertInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PriceAlertsService {
  private readonly logger = new Logger(PriceAlertsService.name);

  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    private readonly notifications: NotificationsService,
  ) {}

  private requireUser(userId?: string | null) {
    if (!userId) throw new UnauthorizedException('Authentication required.');
    return userId;
  }

  private serializeAlert(row: {
    id: string;
    userId: string;
    name?: string | null;
    targetPrice?: unknown;
    thresholdPercent?: unknown;
    baselinePrice?: unknown;
    currency: string;
    direction: string;
    status: string;
    cooldownHours: number;
    lastTriggeredAt?: Date | null;
    lastNotifiedPrice?: unknown;
    createdAt: Date;
    updatedAt: Date;
    material?: { id: string; name: string; slug: string; unit: string } | null;
    location?: { id: string; name: string; slug: string; type: string } | null;
  }) {
    const condition = getPriceAlertCondition(row.direction);
    return {
      id: row.id,
      name: row.name ?? null,
      condition: row.direction,
      conditionLabel: condition?.label ?? row.direction,
      targetPrice: row.targetPrice != null ? Number(row.targetPrice) : null,
      thresholdPercent: row.thresholdPercent != null ? Number(row.thresholdPercent) : null,
      baselinePrice: row.baselinePrice != null ? Number(row.baselinePrice) : null,
      currency: row.currency,
      status: row.status,
      cooldownHours: row.cooldownHours,
      lastTriggeredAt: row.lastTriggeredAt?.toISOString() ?? null,
      lastNotifiedPrice: row.lastNotifiedPrice != null ? Number(row.lastNotifiedPrice) : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      material: row.material
        ? {
            id: row.material.id,
            name: row.material.name,
            slug: row.material.slug,
            unit: row.material.unit,
            hubKey: matchMaterialToHubKey(row.material.slug),
          }
        : null,
      location: row.location
        ? {
            id: row.location.id,
            name: row.location.name,
            slug: row.location.slug,
            type: row.location.type,
          }
        : null,
    };
  }

  async meta() {
    const cities = await this.repos.constructionLocations.listCities(
      PRICE_HUB_CITIES.map((c) => c.slug),
    );
    const materialsPage = await this.repos.constructionMaterials.list({
      status: 'PUBLISHED',
      limit: 200,
    });
    const materialRows = materialsPage.items as unknown as Array<{
      id: string;
      name: string;
      slug: string;
      unit: string;
    }>;
    const materialItems = materialRows
      .map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        unit: m.unit,
        hubKey: matchMaterialToHubKey(m.slug),
      }))
      .filter((m) => m.hubKey != null);

    return {
      conditions: PRICE_ALERT_CONDITIONS,
      maxPerUser: PRICE_ALERT_MAX_PER_USER,
      defaultCooldownHours: PRICE_ALERT_DEFAULT_COOLDOWN_HOURS,
      qualification: PRICE_ALERT_QUALIFICATION,
      cities: PRICE_HUB_CITIES.map((c) => ({
        slug: c.slug,
        name: c.name,
        id: cities.find((x) => x.slug === c.slug)?.id ?? null,
      })),
      materials: materialItems,
    };
  }

  async listMine(userId: string | undefined, status?: string) {
    const uid = this.requireUser(userId);
    const rows = await this.repos.constructionPriceAlerts.listForUser(uid, status);
    const active = rows.filter((r) => r.status === 'ACTIVE');
    const paused = rows.filter((r) => r.status === 'PAUSED');
    return {
      items: rows.map((r) => this.serializeAlert(r)),
      active: active.map((r) => this.serializeAlert(r)),
      paused: paused.map((r) => this.serializeAlert(r)),
      counts: {
        total: rows.length,
        active: active.length,
        paused: paused.length,
      },
    };
  }

  async listTriggerHistory(userId: string | undefined, alertId?: string) {
    const uid = this.requireUser(userId);
    if (alertId) {
      const alert = await this.repos.constructionPriceAlerts.findByIdForUser(alertId, uid);
      if (!alert) throw new NotFoundException('Alert not found.');
      const rows = await this.repos.constructionPriceAlertTriggers.listForAlert(alertId);
      return {
        items: rows.map((r) => ({
          id: r.id,
          alertId: r.alertId,
          observedPrice: Number(r.observedPrice),
          baselinePrice: r.baselinePrice != null ? Number(r.baselinePrice) : null,
          targetPrice: r.targetPrice != null ? Number(r.targetPrice) : null,
          thresholdPercent: r.thresholdPercent != null ? Number(r.thresholdPercent) : null,
          changePercent: r.changePercent != null ? Number(r.changePercent) : null,
          direction: r.direction,
          currency: r.currency,
          suppressed: r.suppressed,
          suppressReason: r.suppressReason,
          notificationId: r.notificationId,
          triggeredAt: r.triggeredAt.toISOString(),
        })),
      };
    }
    const rows = await this.repos.constructionPriceAlertTriggers.listForUser(uid);
    return {
      items: rows.map((r) => ({
        id: r.id,
        alertId: r.alertId,
        observedPrice: Number(r.observedPrice),
        baselinePrice: r.baselinePrice != null ? Number(r.baselinePrice) : null,
        changePercent: r.changePercent != null ? Number(r.changePercent) : null,
        direction: r.direction,
        currency: r.currency,
        suppressed: r.suppressed,
        suppressReason: r.suppressReason,
        notificationId: r.notificationId,
        triggeredAt: r.triggeredAt.toISOString(),
        alert: r.alert
          ? {
              id: r.alert.id,
              name: r.alert.name,
              direction: r.alert.direction,
              material: r.alert.material,
              location: r.alert.location,
            }
          : null,
      })),
    };
  }

  private async resolveFreshPrice(materialId: string, locationId: string) {
    const rows = await this.repos.constructionMaterialPrices.listFiltered({
      materialId,
      locationId,
      take: 20,
    });
    for (const row of rows) {
      if (
        isPriceFreshEnoughForAlert({
          claimed: row.freshness,
          verifiedAt: row.verifiedAt,
          effectiveFrom: row.effectiveFrom,
        })
      ) {
        return {
          id: row.id,
          price: Number(row.price),
          unit: row.unit,
          currency: row.currency,
          freshness: row.freshness,
          effectiveFrom: row.effectiveFrom,
          verifiedAt: row.verifiedAt,
        };
      }
    }
    return null;
  }

  async create(userId: string | undefined, raw: CreateConstructionPriceAlertInput) {
    const uid = this.requireUser(userId);
    const input = createConstructionPriceAlertSchema.parse(raw);

    const count = await this.repos.constructionPriceAlerts.countForUser(uid);
    if (count >= PRICE_ALERT_MAX_PER_USER) {
      throw new BadRequestException(
        `Alert limit reached (${PRICE_ALERT_MAX_PER_USER}). Pause or delete an existing alert first.`,
      );
    }

    const material = await this.repos.constructionMaterials.findById(input.materialId);
    if (!material || material.deletedAt) {
      throw new BadRequestException('Material not found.');
    }
    const loc = await this.repos.constructionLocations.findById(input.locationId);
    if (!loc || !isPriceHubCitySlug(loc.slug)) {
      throw new BadRequestException('Location must be a supported price-hub city.');
    }

    const fresh = await this.resolveFreshPrice(input.materialId, input.locationId);
    const isPct = input.direction === 'DROP_PCT' || input.direction === 'RISE_PCT';
    if (isPct && !fresh) {
      throw new BadRequestException(
        'Percentage alerts require a sufficiently fresh observed price to set the baseline. Try again when current data is available.',
      );
    }

    const row = await this.repos.constructionPriceAlerts.create({
      userId: uid,
      materialId: input.materialId,
      locationId: input.locationId,
      name: input.name ?? null,
      direction: input.direction,
      targetPrice: isPct ? null : (input.targetPrice ?? null),
      thresholdPercent: isPct ? (input.thresholdPercent ?? null) : null,
      baselinePrice: isPct ? fresh!.price : (fresh?.price ?? null),
      currency: input.currency,
      cooldownHours: input.cooldownHours ?? PRICE_ALERT_DEFAULT_COOLDOWN_HOURS,
      status: 'ACTIVE',
    });

    return this.serializeAlert(row);
  }

  async update(userId: string | undefined, id: string, raw: UpdateConstructionPriceAlertInput) {
    const uid = this.requireUser(userId);
    const existing = await this.repos.constructionPriceAlerts.findByIdForUser(id, uid);
    if (!existing) throw new NotFoundException('Alert not found.');
    const input = updateConstructionPriceAlertSchema.parse(raw);

    if (input.status === 'CANCELLED') {
      throw new BadRequestException('Use delete to cancel an alert.');
    }

    const row = await this.repos.constructionPriceAlerts.update(id, {
      ...(input.status ? { status: input.status } : {}),
      ...(input.targetPrice !== undefined ? { targetPrice: input.targetPrice } : {}),
      ...(input.thresholdPercent !== undefined ? { thresholdPercent: input.thresholdPercent } : {}),
      ...(input.cooldownHours !== undefined ? { cooldownHours: input.cooldownHours } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
    });
    return this.serializeAlert(row);
  }

  async pause(userId: string | undefined, id: string) {
    return this.update(userId, id, { status: 'PAUSED' });
  }

  async resume(userId: string | undefined, id: string) {
    return this.update(userId, id, { status: 'ACTIVE' });
  }

  async remove(userId: string | undefined, id: string) {
    const uid = this.requireUser(userId);
    const existing = await this.repos.constructionPriceAlerts.findByIdForUser(id, uid);
    if (!existing) throw new NotFoundException('Alert not found.');
    await this.repos.constructionPriceAlerts.softDelete(id);
    return { ok: true };
  }

  /** Scheduler entry — evaluate ACTIVE alerts against fresh observations. */
  async evaluateActiveAlerts() {
    const alerts = await this.repos.constructionPriceAlerts.listActive(200);
    let checked = 0;
    let triggered = 0;
    let notified = 0;
    let skippedStale = 0;
    let suppressed = 0;

    for (const alert of alerts) {
      checked += 1;
      if (!alert.locationId) {
        skippedStale += 1;
        continue;
      }
      const fresh = await this.resolveFreshPrice(alert.materialId, alert.locationId);
      if (!fresh) {
        skippedStale += 1;
        continue;
      }

      const evaluation = evaluatePriceAlertCondition({
        condition: alert.direction as PriceAlertCondition,
        observedPrice: fresh.price,
        targetPrice: alert.targetPrice != null ? Number(alert.targetPrice) : null,
        thresholdPercent: alert.thresholdPercent != null ? Number(alert.thresholdPercent) : null,
        baselinePrice: alert.baselinePrice != null ? Number(alert.baselinePrice) : null,
      });

      if (!evaluation.triggered) continue;
      triggered += 1;

      const dedupe = shouldSuppressAlertNotification({
        lastTriggeredAt: alert.lastTriggeredAt,
        lastNotifiedPrice: alert.lastNotifiedPrice != null ? Number(alert.lastNotifiedPrice) : null,
        observedPrice: fresh.price,
        cooldownHours: alert.cooldownHours,
      });

      if (dedupe.suppress) {
        suppressed += 1;
        await this.repos.constructionPriceAlertTriggers.create({
          alertId: alert.id,
          observedPrice: fresh.price,
          baselinePrice: alert.baselinePrice,
          targetPrice: alert.targetPrice,
          thresholdPercent: alert.thresholdPercent,
          changePercent: evaluation.changePercent,
          direction: alert.direction,
          currency: alert.currency,
          priceObservationId: fresh.id,
          suppressed: true,
          suppressReason: dedupe.reason,
        });
        continue;
      }

      const materialName = alert.material?.name ?? 'Material';
      const locationName = alert.location?.name ?? 'selected city';
      const conditionLabel = getPriceAlertCondition(alert.direction)?.label ?? alert.direction;
      const title = `Price alert: ${materialName}`;
      const body = `${materialName} in ${locationName} is ₹${fresh.price.toLocaleString('en-IN')} / ${fresh.unit} — condition “${conditionLabel}” met. Verify with local suppliers before acting.`;

      let notificationId: string | null = null;
      try {
        const notification = await this.notifications.sendToUsers({
          userIds: [alert.userId],
          title,
          body,
          channel: 'IN_APP',
          metadata: {
            type: 'construction_price_alert',
            alertId: alert.id,
            materialId: alert.materialId,
            locationId: alert.locationId,
            observedPrice: fresh.price,
            direction: alert.direction,
          },
        });
        notificationId = notification?.id ?? null;
        notified += 1;
      } catch (error) {
        this.logger.warn(
          `Failed to notify user ${alert.userId} for alert ${alert.id}: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      }

      await this.repos.constructionPriceAlertTriggers.create({
        alertId: alert.id,
        observedPrice: fresh.price,
        baselinePrice: alert.baselinePrice,
        targetPrice: alert.targetPrice,
        thresholdPercent: alert.thresholdPercent,
        changePercent: evaluation.changePercent,
        direction: alert.direction,
        currency: alert.currency,
        priceObservationId: fresh.id,
        notificationId,
        suppressed: false,
      });

      await this.repos.constructionPriceAlerts.update(alert.id, {
        lastTriggeredAt: new Date(),
        lastNotifiedPrice: fresh.price,
        lastNotificationId: notificationId,
        status: 'ACTIVE',
      });
    }

    return { checked, triggered, notified, skippedStale, suppressed };
  }
}
