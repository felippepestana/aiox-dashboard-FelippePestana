import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

/** Base Next.js configuration, wrapped with Sentry build-time instrumentation below. */
const nextConfig: NextConfig = {
  serverExternalPackages: ['chokidar'],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  disableLogger: true,
});
