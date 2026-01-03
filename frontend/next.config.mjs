import createNextIntlPlugin from 'next-intl/plugin';

// Note: createNextIntlPlugin doesn't fully support Next.js 16's Turbopack yet
// We manually configure the resolveAlias for Turbopack
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['shared'],
  // Turbopack configuration for Next.js 16
  turbopack: {
    resolveAlias: {
      'next-intl/config': './i18n/request.ts',
    },
  },
};

export default withNextIntl(nextConfig);
