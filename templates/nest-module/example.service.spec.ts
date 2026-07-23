import { describe, expect, it } from 'vitest';
import { ExampleService } from './example.service';

describe('ExampleService', () => {
  it('returns an empty list by default', () => {
    const service = new ExampleService();
    expect(service.list()).toEqual([]);
  });
});
