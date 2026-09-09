import { PrismaClient } from '@prisma/client';
import type { Writable } from 'node:stream';

const BATCH = 250;

export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'bigint') return `${value.toString()}::bigint`;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'NULL';
    return String(value);
  }
  if (value instanceof Date) {
    return `${quoteString(value.toISOString())}::timestamptz`;
  }
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return `${quoteString(`\\x${Buffer.from(value).toString('hex')}`)}::bytea`;
  }
  if (Array.isArray(value)) {
    if (!value.length) return `'{}'`;
    return `ARRAY[${value.map((item) => sqlLiteral(item)).join(', ')}]`;
  }
  if (typeof value === 'object') {
    if ('toFixed' in value && typeof (value as { toFixed?: unknown }).toFixed === 'function') {
      return quoteString(String(value));
    }
    return `${quoteString(JSON.stringify(value))}::jsonb`;
  }
  return quoteString(String(value));
}

function quoteString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function sortTablesByForeignKeys(
  tables: string[],
  fks: Array<{ table: string; references: string }>,
): string[] {
  const set = new Set(tables);
  const incoming = new Map<string, number>();
  const edges = new Map<string, string[]>();
  for (const name of tables) {
    incoming.set(name, 0);
    edges.set(name, []);
  }
  for (const { table, references } of fks) {
    if (!set.has(table) || !set.has(references) || table === references) continue;
    edges.get(references)?.push(table);
    incoming.set(table, (incoming.get(table) ?? 0) + 1);
  }
  const queue = tables.filter((name) => (incoming.get(name) ?? 0) === 0);
  const ordered: string[] = [];
  while (queue.length) {
    const next = queue.shift()!;
    ordered.push(next);
    for (const child of edges.get(next) ?? []) {
      const count = (incoming.get(child) ?? 0) - 1;
      incoming.set(child, count);
      if (count === 0) queue.push(child);
    }
  }
  for (const name of tables) {
    if (!ordered.includes(name)) ordered.push(name);
  }
  return ordered;
}

export async function writeLogicalSqlDump(connectionString: string, out: Writable): Promise<void> {
  const prisma = new PrismaClient({
    datasources: { db: { url: connectionString } },
    log: ['error'],
  });

  const write = (chunk: string) =>
    new Promise<void>((resolve, reject) => {
      if (!out.write(chunk)) {
        out.once('drain', resolve);
        out.once('error', reject);
        return;
      }
      resolve();
    });

  try {
    await prisma.$connect();
    await write(`-- Varnarc SQL dump (built-in exporter; API host has no pg_dump)
-- Restore on empty VPS database:
--   1. createdb varnarc
--   2. DATABASE_URL=<vps> pnpm --filter @varnarc/database migrate:deploy
--   3. psql "$DATABASE_URL" -f this-file.sql

BEGIN;
SET session_replication_role = replica;

`);

    const tables = await prisma.$queryRaw<Array<{ relname: string }>>`
      SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname
    `;
    const names = tables.map((row) => row.relname);
    const fks = await prisma.$queryRaw<Array<{ table: string; references: string }>>`
      SELECT src.relname AS table, tgt.relname AS references
      FROM pg_constraint con
      JOIN pg_class src ON src.oid = con.conrelid
      JOIN pg_class tgt ON tgt.oid = con.confrelid
      JOIN pg_namespace n ON n.oid = src.relnamespace
      WHERE con.contype = 'f' AND n.nspname = 'public'
    `;
    const ordered = sortTablesByForeignKeys(names, fks);

    if (ordered.length) {
      const truncateList = [...ordered]
        .reverse()
        .map((name) => `public.${quoteIdent(name)}`)
        .join(', ');
      await write(`TRUNCATE TABLE ${truncateList} RESTART IDENTITY CASCADE;\n\n`);
    }

    for (const name of ordered) {
      const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${name}
        ORDER BY ordinal_position
      `;
      const cols = columns.map((col) => col.column_name);
      if (!cols.length) continue;

      const ident = `public.${quoteIdent(name)}`;
      const colSql = cols.map(quoteIdent).join(', ');
      let offset = 0;
      for (;;) {
        const rows = (await prisma.$queryRawUnsafe(
          `SELECT * FROM ${ident} ORDER BY ctid OFFSET ${offset} LIMIT ${BATCH}`,
        )) as Array<Record<string, unknown>>;
        if (!rows.length) break;
        for (const row of rows) {
          const values = cols.map((col) => sqlLiteral(row[col])).join(', ');
          await write(`INSERT INTO ${ident} (${colSql}) VALUES (${values});\n`);
        }
        offset += rows.length;
        if (rows.length < BATCH) break;
      }
    }

    const sequences = await prisma.$queryRaw<
      Array<{ sequencename: string; last_value: bigint | number | null; is_called: boolean }>
    >`
      SELECT sequencename, last_value, is_called
      FROM pg_sequences
      WHERE schemaname = 'public'
    `;
    for (const seq of sequences) {
      if (seq.last_value == null) continue;
      const called = seq.is_called ? 'true' : 'false';
      await write(
        `SELECT setval(${quoteString(`public.${seq.sequencename}`)}, ${sqlLiteral(seq.last_value)}, ${called});\n`,
      );
    }

    await write(`
SET session_replication_role = DEFAULT;
COMMIT;
`);
  } finally {
    await prisma.$disconnect();
  }
}
