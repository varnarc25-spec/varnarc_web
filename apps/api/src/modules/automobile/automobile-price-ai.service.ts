import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@varnarc/database';
import type { AutomobileRefreshPricesInput } from '@varnarc/validation';
import { PRISMA } from '../../database/database.module';
import { isLlmConfigured, llmChatCompletion, parseJsonResponse } from '../ai/llm.client';

type PriceGuess = {
  id: string;
  exShowroomInr?: number | null;
  confidence?: number | null;
  skip?: boolean;
};

@Injectable()
export class AutomobilePriceAiService {
  constructor(@Inject(PRISMA) private readonly db: PrismaClient) {}

  async refreshPrices(input: AutomobileRefreshPricesInput, actorId: string) {
    if (!isLlmConfigured()) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'AI_NOT_CONFIGURED',
          message: 'Set OPENAI_API_KEY on the API to fetch indicative prices.',
        },
      });
    }

    const limit = input.limit ?? 10;
    const where = {
      deletedAt: null,
      ...(input.ids?.length ? { id: { in: input.ids } } : {}),
      ...(input.missingOnly !== false && !input.ids?.length
        ? { OR: [{ exShowroomPrice: null }, { exShowroomPrice: 0 }] }
        : {}),
    };

    const rows = await this.db.automobileVehicle.findMany({
      where,
      include: { manufacturer: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: input.ids?.length ? Math.min(input.ids.length, 25) : limit,
    });

    if (!rows.length) {
      return { updated: 0, skipped: 0, message: 'No matching vehicles to price.' };
    }

    const payload = rows.map((row) => ({
      id: row.id,
      make: row.manufacturer.name,
      model: row.model,
      variant: row.variant,
      year: row.modelYear,
      fuel: row.fuelType,
      body: row.bodyType,
    }));

    const raw = await llmChatCompletion(
      [
        {
          role: 'system',
          content:
            'You estimate indicative India ex-showroom prices in INR for cars. ' +
            'Return JSON only: {"prices":[{"id":"uuid","exShowroomInr":number|null,"confidence":0-1,"skip":boolean}]}. ' +
            'Use current typical India market bands. If you are not reasonably sure, set skip true and exShowroomInr null. ' +
            'Never invent a dealer quotation. Integers only, no commas.',
        },
        {
          role: 'user',
          content: JSON.stringify({ market: 'India', currency: 'INR', vehicles: payload }),
        },
      ],
      { json: true, temperature: 0.2, maxTokens: 2000 },
    );

    let parsed: { prices?: PriceGuess[] };
    try {
      parsed = parseJsonResponse<{ prices?: PriceGuess[] }>(raw);
    } catch {
      throw new BadRequestException({
        success: false,
        error: { code: 'AI_PARSE_ERROR', message: 'AI did not return valid price JSON.' },
      });
    }

    const byId = new Map((parsed.prices ?? []).map((p) => [p.id, p]));
    let updated = 0;
    let skipped = 0;
    const now = new Date();

    for (const row of rows) {
      const guess = byId.get(row.id);
      const amount = guess?.exShowroomInr != null ? Number(guess.exShowroomInr) : NaN;
      const confidence = guess?.confidence != null ? Number(guess.confidence) : 0;
      if (
        !guess ||
        guess.skip ||
        !Number.isFinite(amount) ||
        amount < 50000 ||
        amount > 500000000 ||
        confidence < 0.25
      ) {
        skipped += 1;
        continue;
      }
      await this.db.automobileVehicle.update({
        where: { id: row.id },
        data: {
          exShowroomPrice: Math.round(amount),
          sourceName: 'ai-indicative-estimate',
          lastVerifiedAt: now,
          updatedBy: actorId,
        },
      });
      updated += 1;
    }

    return {
      updated,
      skipped,
      examined: rows.length,
      message:
        'Prices are AI indicative India ex-showroom estimates, not dealer quotes. Verify before public use.',
    };
  }
}
