/**
 * Lightweight image dimension probe (no Sharp dependency).
 * Used on upload to reserve layout dimensions and avoid CLS.
 * WebP/AVIF variant generation remains future work — see docs/12-Media-Image-Transforms-FUTURE.md.
 */

export type ImageDimensions = { width: number; height: number };

function readUInt32BE(buffer: Buffer, offset: number): number {
  return buffer.readUInt32BE(offset);
}

function readUInt16LE(buffer: Buffer, offset: number): number {
  return buffer.readUInt16LE(offset);
}

function probePng(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 24) return null;
  if (buffer[0] !== 0x89 || buffer[1] !== 0x50) return null;
  return {
    width: readUInt32BE(buffer, 16),
    height: readUInt32BE(buffer, 20),
  };
}

function probeJpeg(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1] ?? 0;
    const size = buffer.readUInt16BE(offset + 2);
    // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    if (size < 2) break;
    offset += 2 + size;
  }
  return null;
}

function probeWebp(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 30) return null;
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    return null;
  }
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X' && buffer.length >= 30) {
    const width = 1 + (buffer[24] ?? 0) + ((buffer[25] ?? 0) << 8) + ((buffer[26] ?? 0) << 16);
    const height = 1 + (buffer[27] ?? 0) + ((buffer[28] ?? 0) << 8) + ((buffer[29] ?? 0) << 16);
    return { width, height };
  }
  if (chunk === 'VP8 ' && buffer.length >= 30) {
    return {
      width: readUInt16LE(buffer, 26) & 0x3fff,
      height: readUInt16LE(buffer, 28) & 0x3fff,
    };
  }
  if (chunk === 'VP8L' && buffer.length >= 25) {
    const b0 = buffer[21] ?? 0;
    const b1 = buffer[22] ?? 0;
    const b2 = buffer[23] ?? 0;
    const b3 = buffer[24] ?? 0;
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }
  return null;
}

function probeGif(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 10) return null;
  const header = buffer.toString('ascii', 0, 6);
  if (header !== 'GIF87a' && header !== 'GIF89a') return null;
  return {
    width: readUInt16LE(buffer, 6),
    height: readUInt16LE(buffer, 8),
  };
}

function probeSvg(buffer: Buffer): ImageDimensions | null {
  const text = buffer.toString('utf8', 0, Math.min(buffer.length, 4096));
  if (!/<svg[\s>]/i.test(text)) return null;
  const widthMatch = text.match(/\bwidth=["']([\d.]+)(px)?["']/i);
  const heightMatch = text.match(/\bheight=["']([\d.]+)(px)?["']/i);
  if (widthMatch?.[1] && heightMatch?.[1]) {
    const width = Math.round(Number(widthMatch[1]));
    const height = Math.round(Number(heightMatch[1]));
    if (width > 0 && height > 0) return { width, height };
  }
  const viewBox = text.match(/\bviewBox=["']\s*([\d.\s-]+)["']/i);
  if (viewBox?.[1]) {
    const parts = viewBox[1]
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const w = parts[2];
    const h = parts[3];
    if (parts.length === 4 && w != null && h != null && w > 0 && h > 0) {
      return { width: Math.round(w), height: Math.round(h) };
    }
  }
  return null;
}

export function probeImageDimensions(
  buffer: Buffer,
  mimeType?: string | null,
): ImageDimensions | null {
  const mime = (mimeType || '').toLowerCase();
  if (mime.includes('png') || (!mime && buffer[0] === 0x89)) {
    const dims = probePng(buffer);
    if (dims) return dims;
  }
  if (mime.includes('jpeg') || mime.includes('jpg') || (!mime && buffer[0] === 0xff)) {
    const dims = probeJpeg(buffer);
    if (dims) return dims;
  }
  if (mime.includes('webp') || buffer.toString('ascii', 8, 12) === 'WEBP') {
    const dims = probeWebp(buffer);
    if (dims) return dims;
  }
  if (mime.includes('gif')) {
    const dims = probeGif(buffer);
    if (dims) return dims;
  }
  if (mime.includes('svg')) {
    const dims = probeSvg(buffer);
    if (dims) return dims;
  }
  return (
    probePng(buffer) ||
    probeJpeg(buffer) ||
    probeWebp(buffer) ||
    probeGif(buffer) ||
    probeSvg(buffer)
  );
}
