import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const CARS_DIR = '/Users/saiporala/Desktop/mine/cars';
const MANUFACTURERS_CSV = '/Users/saiporala/Desktop/mine/automobile_manufacturers.csv';
const SKIP = new Set([
  'consumables-specifications.csv',
  'sheet-metal-angles-sections-specifications.csv',
]);

function slugify(value, max = 90) {
  const slug = String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug.slice(0, max) || 'vehicle';
}

function parseCsv(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '"') {
      current += ch;
      if (inQuotes && src[i + 1] === '"') {
        current += src[i + 1];
        i += 1;
      } else inQuotes = !inQuotes;
      continue;
    }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      if (current.trim()) lines.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) lines.push(current);

  const parseLine = (line) => {
    const out = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else q = !q;
        continue;
      }
      if (ch === ',' && !q) {
        out.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    out.push(cur);
    return out;
  };

  if (lines.length < 2) return [];
  const headers = parseLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = parseLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] ?? '').trim();
    });
    return row;
  });
}

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function int(v) {
  const n = num(v);
  return n == null ? null : Math.round(n);
}

const prisma = new PrismaClient();

async function main() {
  const actor =
    (await prisma.user.findFirst({
      where: { deletedAt: null, email: { contains: 'varnarc' } },
      select: { id: true },
    })) ?? (await prisma.user.findFirst({ where: { deletedAt: null }, select: { id: true } }));
  const actorId = actor?.id ?? null;
  console.log('actor', actorId);

  const mfrRows = parseCsv(readFileSync(MANUFACTURERS_CSV, 'utf8'));
  for (const row of mfrRows) {
    const name = row.name || row.make;
    if (!name) continue;
    const slug = row.slug || slugify(name);
    await prisma.automobileManufacturer.upsert({
      where: { slug },
      update: {
        name,
        country: row.country || null,
        website: row.website || null,
        status: row.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
        featured: String(row.featured).toLowerCase() === 'true',
        updatedBy: actorId,
        deletedAt: null,
      },
      create: {
        name,
        slug,
        country: row.country || null,
        website: row.website || null,
        status: row.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
        featured: String(row.featured).toLowerCase() === 'true',
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }
  console.log('manufacturers upserted', mfrRows.length);

  const mfrCache = new Map();
  const existingMfr = await prisma.automobileManufacturer.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, name: true },
  });
  for (const m of existingMfr) mfrCache.set(m.slug, m);

  async function ensureMfr(name) {
    const slug = slugify(name);
    const hit = mfrCache.get(slug);
    if (hit) return hit;
    const created = await prisma.automobileManufacturer.upsert({
      where: { slug },
      update: { deletedAt: null, updatedBy: actorId },
      create: {
        name,
        slug,
        status: 'PUBLISHED',
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
    const rec = { id: created.id, slug: created.slug, name: created.name };
    mfrCache.set(slug, rec);
    return rec;
  }

  const files = readdirSync(CARS_DIR)
    .filter((f) => f.endsWith('-specifications.csv') && !SKIP.has(f))
    .sort();

  const vehicles = [];
  const seenKey = new Set();
  const seenSlug = new Set();
  const existingSlugs = new Set(
    (await prisma.automobileVehicle.findMany({ select: { slug: true } })).map((v) => v.slug),
  );

  for (const file of files) {
    const rows = parseCsv(readFileSync(join(CARS_DIR, file), 'utf8'));
    for (const row of rows) {
      const make = row.make || row.manufacturer || '';
      const model = row.model || '';
      if (!make || !model) continue;
      const manufacturer = await ensureMfr(make);
      const variant =
        [row.variant, row.yearFrom, row.engineDisplacement].filter(Boolean).join(' · ').trim() ||
        '';
      const key = `${manufacturer.id}|${model}|${variant}`;
      if (seenKey.has(key)) continue;
      seenKey.add(key);
      let slug = slugify(
        `${make}-${model}-${row.variant || ''}-${row.yearFrom || ''}-${row.engineDisplacement || ''}`,
      );
      if (seenSlug.has(slug) || existingSlugs.has(slug)) {
        slug = `${slug.slice(0, 80)}-${createHash('sha1').update(key).digest('hex').slice(0, 8)}`;
      }
      seenSlug.add(slug);
      vehicles.push({
        id: randomUUID(),
        manufacturerId: manufacturer.id,
        name: [make, model, row.variant].filter(Boolean).join(' '),
        slug,
        model,
        variant,
        modelYear: int(row.yearFrom),
        bodyType: row.bodyType || null,
        fuelType: row.engineFuelType || row.fuelType || null,
        engineCapacity: row.engineDisplacement || row.engineCapacity || null,
        horsepower: num(row.enginePowerBhp),
        torque: num(row.engineTorqueNm),
        mileage: num(row.fuelEconomyCombinedL100),
        seatingCapacity: int(row.seats),
        bootSpace: num(row.bootLitres),
        specifications: row,
        status: 'PUBLISHED',
        createdBy: actorId,
        updatedBy: actorId,
      });
    }
    process.stdout.write(`parsed ${file} total=${vehicles.length}\n`);
  }

  console.log('unique vehicles', vehicles.length);
  const chunkSize = 200;
  let created = 0;
  for (let i = 0; i < vehicles.length; i += chunkSize) {
    const chunk = vehicles.slice(i, i + chunkSize);
    const result = await prisma.automobileVehicle.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    created += result.count;
    if (i % 2000 === 0) console.log(`inserted ${i + chunk.length}/${vehicles.length}`);
  }
  console.log('createMany inserted', created, 'of', vehicles.length);

  const counts = {
    manufacturers: await prisma.automobileManufacturer.count({ where: { deletedAt: null } }),
    vehicles: await prisma.automobileVehicle.count({ where: { deletedAt: null } }),
  };
  console.log('db counts', counts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
