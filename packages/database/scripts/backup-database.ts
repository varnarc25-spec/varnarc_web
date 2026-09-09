import path from 'node:path';
import {
  defaultBackupFilename,
  dumpConnectionUrl,
  summarizeDumpConnection,
  writePgDumpFile,
} from '../src/pg-backup';

async function main() {
  const url = dumpConnectionUrl();
  if (!url) {
    console.error('Set DATABASE_URL or DATABASE_DIRECT_URL in .env');
    process.exit(1);
  }

  const summary = summarizeDumpConnection(url);
  console.log(
    `Dumping ${summary.database ?? 'database'} at ${summary.host ?? 'unknown host'} (${summary.providerHint})`,
  );

  const outArg = process.argv.find((arg) => arg.startsWith('--out='))?.slice('--out='.length);
  const out = outArg || path.join(process.cwd(), 'backups', defaultBackupFilename());

  const written = await writePgDumpFile(url, path.resolve(out));
  console.log(`Wrote ${written}`);
  console.log(
    'Restore on VPS: pnpm db:restore -- --url=postgresql://USER:PASS@VPS:5432/varnarc --file=' +
      written,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
