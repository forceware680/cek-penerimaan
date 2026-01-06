import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // External packages that should be bundled for serverless
  serverExternalPackages: ['mssql'],
  // Disable ESLint during builds for faster deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during builds (we can still see them in dev)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
