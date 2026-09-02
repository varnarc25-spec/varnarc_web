import { describe, expect, it } from 'vitest';
import {
  detectAutomobileCsvEntity,
  parseCsv,
  slugify,
} from '../src/modules/automobile/automobile-csv.util';

describe('automobile-csv.util', () => {
  it('parses quoted commas', () => {
    const rows = parseCsv('name,model\n"Swift, VXI",Swift');
    expect(rows).toEqual([{ name: 'Swift, VXI', model: 'Swift' }]);
  });

  it('detects entity from filename and headers', () => {
    expect(detectAutomobileCsvEntity('automobile_manufacturers.csv', ['name', 'slug'])).toBe(
      'manufacturers',
    );
    expect(detectAutomobileCsvEntity('acura-specifications.csv', ['make', 'model'])).toBe('specs');
    expect(detectAutomobileCsvEntity('photos.csv', ['vehicleSlug', 'imageUrl'])).toBe(
      'vehicle-images',
    );
    expect(detectAutomobileCsvEntity('links.csv', ['vehicleSlug', 'reviewSlug'])).toBe(
      'vehicle-reviews',
    );
  });

  it('slugifies names', () => {
    expect(slugify('Maruti Suzuki Swift VXI')).toBe('maruti-suzuki-swift-vxi');
  });
});
