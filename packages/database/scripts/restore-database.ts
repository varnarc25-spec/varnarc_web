import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { stripUnsupportedParams } from '../src/pg-backup';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const url = stripUnsupportedParams(arg('url')?.trim() || process.env.DATABASE_URL || '');
  const file = arg('file');
  if (!url || !file) {
    console.error(
      'Usage: pnpm db:restore -- --url=postgresql://USER:PASS@HOST:5432/DB --file=backups/varnarc.sql',
    );
    process.exit(1);
  }

  const resolved = path.resolve(file);
  await access(resolved);

  await new Promise<void>((resolve, reject) => {
    const child = spawn('psql', ['--set', 'ON_ERROR_STOP=1', url, '-f', resolved], {
      stdio: 'inherit',
    });
    child.on('error', (error) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new Error('psql is not installed. Install PostgreSQL client tools on this machine.'),
        );
        return;
      }
      reject(error);
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`psql exited with ${code}`));
    });
  });

  console.log('Restore finished. Point API/web DATABASE_URL at the VPS database and restart.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
