import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts'],
    globals: false,
  },
  resolve: {
    alias: {
      '@varnarc/database': path.resolve(__dirname, '../../packages/database/src/index.ts'),
      '@varnarc/validation': path.resolve(__dirname, '../../packages/validation/src/index.ts'),
      '@varnarc/auth': path.resolve(__dirname, '../../packages/auth/src/index.ts'),
      '@varnarc/config': path.resolve(__dirname, '../../packages/config/src/index.ts'),
      '@varnarc/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
    },
  },
});
