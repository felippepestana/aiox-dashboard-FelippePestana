import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker deployment
  output: 'standalone',
  // Externalize native modules that can't be bundled
  serverExternalPackages: ['chokidar'],
};

export default nextConfig;
