import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use 'standalone' only for Docker: output: 'standalone',
  serverExternalPackages: ['chokidar'],
};

// Wrap with Sentry if available
let finalConfig: NextConfig = nextConfig;
try {
  const { withSentryConfig } = require('@sentry/nextjs');
  finalConfig = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    tunnelRoute: '/monitoring',
    disableLogger: true,
  });
} catch {
  // Sentry not installed — use base config
}

export default finalConfig;
