import type { PrismaClient } from '@varnarc/database';
import { randomUUID } from 'node:crypto';

export type VehicleImageResult = {
  imageUrl: string | null;
  provider: 'varnarc' | 'wikimedia' | 'pexels' | 'placeholder';
  sourcePage?: string | null;
  author?: string | null;
  license?: string | null;
  attribution?: string | null;
  photoId?: string | null;
  queryUsed?: string | null;
  confidence: number;
};

const SUCCESS_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function cacheKey(make: string, model: string, year?: number | null) {
  return [make.trim().toLowerCase(), model.trim().toLowerCase(), year ?? ''].join('|');
}

async function fetchJson(url: string, timeoutMs = 4000, headers?: Record<string, string>) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'VarnarcAutomobile/1.0 (https://varnarc.com)', ...headers },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function resolveWikimedia(
  make: string,
  model: string,
  year?: number | null,
): Promise<VehicleImageResult | null> {
  const q = [year, make, model].filter(Boolean).join(' ');
  const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(`${make} ${model}`)}&language=en&format=json&limit=5`;
  const search = await fetchJson(searchUrl);
  const results =
    (search?.search as Array<{ id?: string; description?: string }> | undefined) ?? [];
  const entity =
    results.find((r) => /car|automobile|vehicle|model/i.test(r.description ?? '')) ?? results[0];
  if (!entity?.id) return null;
  const entUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entity.id}&props=claims|labels&languages=en&format=json`;
  const ent = await fetchJson(entUrl);
  const claims = (
    ent?.entities as Record<
      string,
      { claims?: { P18?: Array<{ mainsnak?: { datavalue?: { value?: string } } }> } }
    >
  )?.[entity.id]?.claims;
  const fileName = claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if (!fileName) return null;
  const title = `File:${fileName}`;
  const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|extmetadata|mime&format=json`;
  const info = await fetchJson(infoUrl);
  const pages =
    (info?.query as { pages?: Record<string, { imageinfo?: Array<Record<string, unknown>> }> })
      ?.pages ?? {};
  const imageinfo = Object.values(pages)[0]?.imageinfo?.[0];
  const url = typeof imageinfo?.url === 'string' ? imageinfo.url : null;
  if (!url) return null;
  const meta = (imageinfo?.extmetadata ?? {}) as Record<string, { value?: string }>;
  const artist = meta.Artist?.value?.replace(/<[^>]+>/g, '') ?? 'Wikimedia Commons contributors';
  const license = meta.LicenseShortName?.value ?? meta.UsageTerms?.value ?? 'Wikimedia Commons';
  return {
    imageUrl: url,
    provider: 'wikimedia',
    sourcePage:
      typeof imageinfo?.descriptionurl === 'string'
        ? imageinfo.descriptionurl
        : `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
    author: artist,
    license,
    attribution: `${artist} / ${license}`,
    queryUsed: q,
    confidence: 0.7,
  };
}

async function resolvePexels(
  make: string,
  model: string,
  year?: number | null,
): Promise<VehicleImageResult | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  const queries = [
    [year, make, model, 'car'].filter(Boolean).join(' '),
    `${make} ${model} car`,
    `${make} car`,
  ];
  for (const query of queries) {
    const data = await fetchJson(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
      4000,
      { Authorization: key },
    );
    const photo = (
      data?.photos as Array<{
        id?: number;
        url?: string;
        photographer?: string;
        src?: { large?: string; landscape?: string };
      }>
    )?.[0];
    const imageUrl = photo?.src?.landscape || photo?.src?.large;
    if (!imageUrl) continue;
    return {
      imageUrl,
      provider: 'pexels',
      sourcePage: photo.url ?? null,
      author: photo.photographer ?? 'Pexels photographer',
      license: 'Pexels License',
      attribution: `${photo.photographer ?? 'Pexels'} / Pexels`,
      photoId: photo.id != null ? String(photo.id) : null,
      queryUsed: query,
      confidence: 0.35,
    };
  }
  return null;
}

export class VehicleImageProvider {
  constructor(private readonly db: PrismaClient) {}

  async resolve(input: {
    vehicleId?: string;
    make: string;
    model: string;
    year?: number | null;
    existingUrl?: string | null;
    manufacturerLogo?: string | null;
  }): Promise<VehicleImageResult> {
    if (input.existingUrl) {
      return {
        imageUrl: input.existingUrl,
        provider: 'varnarc',
        confidence: 1,
        attribution: 'Varnarc catalogue',
      };
    }
    const key = cacheKey(input.make, input.model, input.year);
    const cached = await this.db.automobileImageCache.findUnique({ where: { cacheKey: key } });
    const now = new Date();
    if (cached && cached.expiresAt > now) {
      return {
        imageUrl: cached.imageUrl,
        provider: (cached.provider as VehicleImageResult['provider']) || 'placeholder',
        sourcePage: cached.sourcePage,
        author: cached.author,
        license: cached.license,
        attribution: cached.attribution,
        photoId: cached.photoId,
        queryUsed: cached.queryUsed,
        confidence: cached.confidence != null ? Number(cached.confidence) : 0,
      };
    }

    const wiki = await resolveWikimedia(input.make, input.model, input.year);
    const pexels = wiki ? null : await resolvePexels(input.make, input.model, input.year);
    const resolved =
      wiki ??
      pexels ??
      (input.manufacturerLogo
        ? {
            imageUrl: input.manufacturerLogo,
            provider: 'placeholder' as const,
            confidence: 0.2,
            attribution: 'Manufacturer logo',
          }
        : {
            imageUrl: null,
            provider: 'placeholder' as const,
            confidence: 0,
          });

    const hit = Boolean(resolved.imageUrl);
    await this.db.automobileImageCache.upsert({
      where: { cacheKey: key },
      update: {
        status: hit ? 'HIT' : 'MISS',
        provider: resolved.provider,
        imageUrl: resolved.imageUrl,
        sourcePage: resolved.sourcePage,
        author: resolved.author,
        license: resolved.license,
        attribution: resolved.attribution,
        photoId: resolved.photoId,
        queryUsed: resolved.queryUsed,
        confidence: resolved.confidence,
        lastVerifiedAt: now,
        expiresAt: new Date(now.getTime() + (hit ? SUCCESS_TTL_MS : MISS_TTL_MS)),
      },
      create: {
        id: randomUUID(),
        cacheKey: key,
        status: hit ? 'HIT' : 'MISS',
        provider: resolved.provider,
        imageUrl: resolved.imageUrl,
        sourcePage: resolved.sourcePage,
        author: resolved.author,
        license: resolved.license,
        attribution: resolved.attribution,
        photoId: resolved.photoId,
        queryUsed: resolved.queryUsed,
        confidence: resolved.confidence,
        lastVerifiedAt: now,
        expiresAt: new Date(now.getTime() + (hit ? SUCCESS_TTL_MS : MISS_TTL_MS)),
      },
    });

    if (input.vehicleId && resolved.imageUrl && resolved.provider !== 'placeholder') {
      await this.db.automobileVehicle.updateMany({
        where: { id: input.vehicleId },
        data: {
          imageUrl: resolved.imageUrl,
          imageSource: resolved.provider,
          imageSourcePage: resolved.sourcePage,
          imageAuthor: resolved.author,
          imageLicense: resolved.license,
          imageAttribution: resolved.attribution,
          imageLastVerifiedAt: now,
          imageConfidence: resolved.confidence,
        },
      });
    }

    return resolved;
  }
}
