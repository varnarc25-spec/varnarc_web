import { describe, expect, it } from 'vitest';
import { neonPoolerToDirect, summarizeDumpConnection } from '../../packages/database/src/pg-backup';

describe('neonPoolerToDirect', () => {
  it('rewrites Neon pooler host and drops channel_binding', () => {
    const input =
      'postgresql://u:p@ep-test-pooler.ap-southeast-1.aws.neon.tech/varnarc_db?sslmode=require&channel_binding=require';
    const next = neonPoolerToDirect(input);
    expect(next).toContain('ep-test.ap-southeast-1.aws.neon.tech');
    expect(next).not.toContain('-pooler.');
    expect(next).not.toContain('channel_binding');
  });
});

describe('summarizeDumpConnection', () => {
  it('masks host and never returns a password', () => {
    const summary = summarizeDumpConnection(
      'postgresql://owner:secret@ep-abcde123.ap-southeast-1.aws.neon.tech/varnarc_db?sslmode=require',
    );
    expect(summary.configured).toBe(true);
    expect(summary.providerHint).toBe('neon');
    expect(summary.database).toBe('varnarc_db');
    expect(JSON.stringify(summary)).not.toContain('secret');
    expect(summary.host).toContain('***');
  });
});
