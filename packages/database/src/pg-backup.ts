import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { PassThrough, type Readable } from 'node:stream';
import { writeLogicalSqlDump } from './pg-logical-dump';

export type DumpConnectionSummary = {
  configured: boolean;
  host: string | null;
  port: number | null;
  database: string | null;
  ssl: boolean;
  usesPooler: boolean;
  providerHint: 'neon' | 'postgres';
};

/** Prefer a non-pooler URL so pg_dump is not routed through PgBouncer. */
export function dumpConnectionUrl(): string {
  const direct = process.env.DATABASE_DIRECT_URL?.trim();
  if (direct) return stripUnsupportedParams(direct);
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return '';
  return neonPoolerToDirect(url);
}

export function stripUnsupportedParams(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete('channel_binding');
    return url.toString();
  } catch {
    return connectionString;
  }
}

export function neonPoolerToDirect(connectionString: string): string {
  const stripped = stripUnsupportedParams(connectionString);
  try {
    const url = new URL(stripped);
    url.hostname = url.hostname.replace('-pooler.', '.');
    return url.toString();
  } catch {
    return stripped.replace('-pooler.', '.');
  }
}

export function summarizeDumpConnection(connectionString: string): DumpConnectionSummary {
  if (!connectionString.trim()) {
    return {
      configured: false,
      host: null,
      port: null,
      database: null,
      ssl: false,
      usesPooler: false,
      providerHint: 'postgres',
    };
  }
  try {
    const url = new URL(connectionString);
    const host = url.hostname;
    const usesPooler = host.includes('-pooler.');
    return {
      configured: true,
      host: maskHost(host),
      port: url.port ? Number(url.port) : 5432,
      database: decodeURIComponent(url.pathname.replace(/^\//, '')) || null,
      ssl: url.searchParams.get('sslmode') !== 'disable',
      usesPooler,
      providerHint: host.includes('neon.tech') ? 'neon' : 'postgres',
    };
  } catch {
    return {
      configured: true,
      host: '***',
      port: null,
      database: null,
      ssl: true,
      usesPooler: /pooler/i.test(connectionString),
      providerHint: /neon/i.test(connectionString) ? 'neon' : 'postgres',
    };
  }
}

function maskHost(host: string): string {
  const parts = host.split('.');
  if (parts[0] && parts[0].length > 6) {
    parts[0] = `${parts[0].slice(0, 4)}***`;
  }
  return parts.join('.');
}

export function defaultBackupFilename(now = new Date()): string {
  const stamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  return `varnarc-${stamp}.sql`;
}

export async function isPgDumpAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('pg_dump', ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });
}

export type PgDumpHandle = {
  stdout: Readable;
  filename: string;
  wait: Promise<void>;
};

export function spawnPgDump(connectionString: string): PgDumpHandle {
  const url = neonPoolerToDirect(connectionString);
  const filename = defaultBackupFilename();
  const child = spawn(
    'pg_dump',
    ['--no-owner', '--no-acl', '--format=plain', '--encoding=UTF8', '--verbose', url],
    {
      env: { ...process.env, PGCONNECT_TIMEOUT: '30' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  const stderrChunks: Buffer[] = [];
  child.stderr?.on('data', (chunk: Buffer) => {
    stderrChunks.push(chunk);
  });

  const wait = new Promise<void>((resolve, reject) => {
    child.on('error', (error) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new Error(
            'pg_dump is not installed. Install PostgreSQL client tools, or run pnpm db:backup on a machine that has them.',
          ),
        );
        return;
      }
      reject(error);
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      const stderr = Buffer.concat(stderrChunks).toString('utf8').slice(-2000);
      reject(new Error(`pg_dump failed (${code}). ${stderr || 'No stderr.'}`));
    });
  });

  if (!child.stdout) {
    throw new Error('pg_dump did not expose stdout');
  }

  return { stdout: child.stdout, filename, wait };
}

export async function openDatabaseDump(connectionString: string): Promise<PgDumpHandle> {
  const filename = defaultBackupFilename();
  if (await isPgDumpAvailable()) {
    return spawnPgDump(connectionString);
  }

  const stdout = new PassThrough();
  const wait = writeLogicalSqlDump(neonPoolerToDirect(connectionString), stdout).then(
    () => {
      stdout.end();
    },
    (error: unknown) => {
      stdout.destroy(error instanceof Error ? error : new Error(String(error)));
      throw error;
    },
  );
  return { stdout, filename, wait };
}

export async function writePgDumpFile(
  connectionString: string,
  outputPath: string,
): Promise<string> {
  const { stdout, wait } = await openDatabaseDump(connectionString);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const file = createWriteStream(outputPath);
    stdout.pipe(file);
    file.on('finish', resolve);
    file.on('error', reject);
    stdout.on('error', reject);
  });
  await wait;
  return outputPath;
}
