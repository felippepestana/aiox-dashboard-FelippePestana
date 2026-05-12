import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use 'standalone' only for Docker: output: 'standalone',
  serverExternalPackages: ['chokidar'],
};

export default nextConfig;
