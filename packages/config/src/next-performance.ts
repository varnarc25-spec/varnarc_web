/** Shared Next.js performance defaults (no `next` import — safe for @varnarc/config). */
export const nextPerformanceDefaults = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'] as const,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: 'https' as const, hostname: 'storage.googleapis.com' },
      { protocol: 'https' as const, hostname: '**.googleusercontent.com' },
      { protocol: 'https' as const, hostname: 'res.cloudinary.com' },
      { protocol: 'https' as const, hostname: '**.cloudinary.com' },
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
    ],
  },
};

export function withPerformanceDefaults<T extends Record<string, unknown>>(config: T): T {
  const experimental = {
    ...(typeof config.experimental === 'object' && config.experimental !== null
      ? config.experimental
      : {}),
    ...nextPerformanceDefaults.experimental,
  };

  return {
    ...config,
    poweredByHeader: nextPerformanceDefaults.poweredByHeader,
    compress: nextPerformanceDefaults.compress,
    images: nextPerformanceDefaults.images,
    experimental,
  };
}
