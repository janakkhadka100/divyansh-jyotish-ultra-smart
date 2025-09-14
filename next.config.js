const withNextIntl = require('next-intl/plugin')(
  './src/i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  turbopack: {
    root: './'
  }
};

module.exports = withNextIntl(nextConfig);
