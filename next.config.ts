import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Only a non-secret namespace is embedded at build time. Production data
  // persists across releases; branch/preview deploys get separate stores.
  env: {
    FOREVER_STORE_SCOPE: ['deploy-preview', 'branch-deploy'].includes(process.env.CONTEXT || '')
      ? `preview-${process.env.DEPLOY_ID || 'local'}` : 'production',
  },
};

export default nextConfig;
