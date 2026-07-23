import { describe, expect, it } from 'vitest';
import { validateFileSignature } from '../src/media';

describe('validateFileSignature', () => {
  it('accepts valid JPEG header', () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(validateFileSignature(buffer, 'image/jpeg')).toBe(true);
  });

  it('rejects mismatched PNG header', () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    expect(validateFileSignature(buffer, 'image/png')).toBe(false);
  });

  it('skips unknown mime types', () => {
    const buffer = Buffer.from([0x00, 0x01]);
    expect(validateFileSignature(buffer, 'text/plain')).toBe(true);
  });
});
