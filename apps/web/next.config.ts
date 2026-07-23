import type { NextConfig } from 'next';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import { withPerformanceDefaults, getCdnHeaderRules, withSecurityHeaders } from '@varnarc/config';

const rootEnv = path.join(__dirname, '../..', '.env');
if (existsSync(rootEnv)) {
  loadEnv({ path: rootEnv });
}

const nextConfig: NextConfig = withSecurityHeaders(
  withPerformanceDefaults({
  transpilePackages: [
    '@varnarc/ui',
    '@varnarc/hooks',
    '@varnarc/config',
    '@varnarc/types',
    '@varnarc/auth',
    '@varnarc/validation',
  ],
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  async headers() {
    return getCdnHeaderRules();
  },
  }),
);

export default nextConfig;
