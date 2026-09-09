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
    async redirects() {
      return [
        {
          source: '/home',
          destination: '/',
          permanent: true,
        },
        {
          source: '/blog',
          destination: '/articles',
          permanent: true,
        },
        {
          source: '/blog/:path*',
          destination: '/articles/:path*',
          permanent: true,
        },
        {
          source: '/pages/term-conditions',
          destination: '/terms',
          permanent: true,
        },
        {
          source: '/pages/terms-conditions',
          destination: '/terms',
          permanent: true,
        },
        {
          source: '/pages/terms-and-conditions',
          destination: '/terms',
          permanent: true,
        },
        {
          source: '/digitalmarketing/:path*',
          destination: '/',
          permanent: true,
        },
        {
          source: '/finance/methodology',
          destination: '/finance/loans/methodology',
          permanent: true,
        },
        {
          source: '/calculators/cement',
          destination: '/construction/cement-calculator',
          permanent: true,
        },
        {
          source: '/calculators/concrete',
          destination: '/construction/concrete-calculator',
          permanent: true,
        },
        {
          source: '/calculators/brick',
          destination: '/construction/brick-calculator',
          permanent: true,
        },
        {
          source: '/calculators/steel',
          destination: '/construction/steel-calculator',
          permanent: true,
        },
        {
          source: '/calculators/bbs',
          destination: '/construction/bar-bending-schedule',
          permanent: true,
        },
        {
          source: '/calculators/bar-bending-schedule',
          destination: '/construction/bar-bending-schedule',
          permanent: true,
        },
        {
          source: '/calculators/boq',
          destination: '/construction/boq',
          permanent: true,
        },
        {
          source: '/calculators/boq-generator',
          destination: '/construction/boq',
          permanent: true,
        },
        {
          source: '/construction/boq-generator',
          destination: '/construction/boq',
          permanent: true,
        },
        {
          source: '/calculators/timeline',
          destination: '/construction/timeline-planner',
          permanent: true,
        },
        {
          source: '/calculators/timeline-planner',
          destination: '/construction/timeline-planner',
          permanent: true,
        },
        {
          source: '/calculators/budget',
          destination: '/construction/budget-tracker',
          permanent: true,
        },
        {
          source: '/calculators/budget-tracker',
          destination: '/construction/budget-tracker',
          permanent: true,
        },
        {
          source: '/calculators/documents',
          destination: '/construction/document-vault',
          permanent: true,
        },
        {
          source: '/calculators/document-vault',
          destination: '/construction/document-vault',
          permanent: true,
        },
        {
          source: '/calculators/material-selector',
          destination: '/construction/material-selector',
          permanent: true,
        },
        {
          source: '/calculators/sand',
          destination: '/construction/sand-calculator',
          permanent: true,
        },
        {
          source: '/calculators/aggregate',
          destination: '/construction/aggregate-calculator',
          permanent: true,
        },
        {
          source: '/calculators/plaster',
          destination: '/construction/plaster-calculator',
          permanent: true,
        },
        {
          source: '/calculators/paint',
          destination: '/construction/paint-calculator',
          permanent: true,
        },
        {
          source: '/calculators/tile',
          destination: '/construction/tile-calculator',
          permanent: true,
        },
        {
          source: '/calculators/flooring',
          destination: '/construction/flooring-calculator',
          permanent: true,
        },
        {
          source: '/calculators/rcc',
          destination: '/construction/rcc-calculator',
          permanent: true,
        },
        {
          source: '/construction/calculators/false-ceiling',
          destination: '/construction/false-ceiling-calculator',
          permanent: true,
        },
        {
          source: '/construction/calculators/staircase',
          destination: '/construction/staircase-calculator',
          permanent: true,
        },
        {
          source: '/construction/calculators/water-tank',
          destination: '/construction/water-tank-calculator',
          permanent: true,
        },
        {
          source: '/construction/calculators/roofing',
          destination: '/construction/roofing-calculator',
          permanent: true,
        },
        {
          source: '/construction/calculators/aac-block',
          destination: '/construction/aac-block-calculator',
          permanent: true,
        },
        {
          source: '/construction/calculators/wall-area',
          destination: '/construction/wall-area-calculator',
          permanent: true,
        },
        {
          source: '/construction/calculators/excavation',
          destination: '/construction/excavation-calculator',
          permanent: true,
        },
      ];
    },
  }),
);

export default nextConfig;
