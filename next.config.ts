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
  // Must NOT collide with middleware's protected '/monitor*' prefix, or
  // unauthenticated Sentry envelopes would be redirected to /login
  tunnelRoute: '/sentry-tunnel',
  disableLogger: true,
});
