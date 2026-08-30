import { describe, expect, it } from 'vitest';
import { calculateTileQuantity } from '../src/tile-calculator';

describe('calculateTileQuantity — floor forward', () => {
  it('computes grid tiles, wastage and boxes', () => {
    // 3m × 3m room, 300×300 mm tiles, no grout → 10×10 = 100; 10% wastage → 10; total 110
    const r = calculateTileQuantity({
      mode: 'forward',
      surface: 'floor',
      roomLength: 3,
      roomWidth: 3,
      roomLengthUnit: 'm',
      roomWidthUnit: 'm',
      tileLength: 300,
      tileWidth: 300,
      tileLengthUnit: 'mm',
      tileWidthUnit: 'mm',
      wastagePercent: 10,
      numberOfRooms: 1,
      tilesPerBox: 10,
      pricePerBoxInr: 500,
    });
    expect(r.surfaceAreaM2).toBeCloseTo(9, 4);
    expect(r.tileAreaM2).toBeCloseTo(0.09, 6);
    expect(r.baseTiles).toBe(100);
    expect(r.wastageTiles).toBe(10);
    expect(r.totalTiles).toBe(110);
    expect(r.boxesNeeded).toBe(11);
    expect(r.estimatedCostInr).toBe(5500);
    expect(r.grid?.tilesAlongLength).toBe(10);
    expect(r.formula).toMatch(/ceil/);
  });

  it('multiplies by number of rooms', () => {
    const r = calculateTileQuantity({
      mode: 'forward',
      surface: 'floor',
      roomLength: 2,
      roomWidth: 2,
      tileLength: 500,
      tileWidth: 500,
      tileLengthUnit: 'mm',
      tileWidthUnit: 'mm',
      wastagePercent: 0,
      numberOfRooms: 3,
    });
    // 2/0.5 = 4 → 16 per room × 3 = 48
    expect(r.baseTiles).toBe(48);
    expect(r.totalTiles).toBe(48);
  });

  it('includes grout in pitch', () => {
    const r = calculateTileQuantity({
      mode: 'forward',
      surface: 'floor',
      roomLength: 1,
      roomWidth: 1,
      tileLength: 300,
      tileWidth: 300,
      tileLengthUnit: 'mm',
      tileWidthUnit: 'mm',
      groutWidth: 5,
      groutWidthUnit: 'mm',
      wastagePercent: 0,
      numberOfRooms: 1,
    });
    // pitch 0.305 → ceil(1/0.305)=4 → 16 tiles
    expect(r.grid?.tilesAlongLength).toBe(4);
    expect(r.baseTiles).toBe(16);
  });
});

describe('wall mode', () => {
  it('treats dimensions as wall length × height', () => {
    const r = calculateTileQuantity({
      mode: 'forward',
      surface: 'wall',
      roomLength: 4,
      roomWidth: 2.5,
      tileLength: 300,
      tileWidth: 450,
      tileLengthUnit: 'mm',
      tileWidthUnit: 'mm',
      wastagePercent: 5,
      numberOfRooms: 1,
    });
    expect(r.surface).toBe('wall');
    expect(r.surfaceAreaM2).toBeCloseTo(10, 4);
    expect(r.totalTiles).toBeGreaterThan(r.baseTiles);
    expect(r.assumptions.some((a) => /Wall/i.test(a))).toBe(true);
  });
});

describe('imperial units', () => {
  it('accepts ft room and inch tiles', () => {
    const r = calculateTileQuantity({
      mode: 'forward',
      surface: 'floor',
      roomLength: 10,
      roomWidth: 12,
      roomLengthUnit: 'ft',
      roomWidthUnit: 'ft',
      tileLength: 12,
      tileWidth: 12,
      tileLengthUnit: 'inch',
      tileWidthUnit: 'inch',
      wastagePercent: 0,
    });
    expect(r.surfaceAreaM2).toBeCloseTo(10 * 0.3048 * 12 * 0.3048, 3);
    expect(r.baseTiles).toBe(10 * 12); // 1 ft tiles on 10×12 ft
  });
});

describe('reverse mode', () => {
  it('estimates coverable area from tile count', () => {
    const r = calculateTileQuantity({
      mode: 'reverse',
      surface: 'floor',
      availableTiles: 110,
      tileLength: 300,
      tileWidth: 300,
      tileLengthUnit: 'mm',
      tileWidthUnit: 'mm',
      wastagePercent: 10,
    });
    // effective = 100; area = 9 m²
    expect(r.coverableAreaM2).toBeCloseTo(9, 3);
    expect(r.mode).toBe('reverse');
  });
});
