import { describe, expect, it } from 'vitest';
import { OpenSearchClient } from '../src/modules/search/opensearch.client';

describe('OpenSearchClient', () => {
  it('builds stable document ids', () => {
    const client = new OpenSearchClient({
      url: 'https://os.example.com',
      index: 'test',
      requestTimeoutMs: 1000,
    });
    expect(client.docId('ARTICLE', 'uuid-1')).toBe('ARTICLE:uuid-1');
  });
});
