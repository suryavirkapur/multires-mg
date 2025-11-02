import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore pdfjs worker files that cause bundling issues
      config.resolve.alias = {
        ...config.resolve.alias,
        "pdfjs-dist/build/pdf.worker.mjs": false,
        "pdfjs-dist/legacy/build/pdf.worker.mjs": false,
      };
      // Mark pdf-parse as external to avoid bundling issues
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push("pdf-parse");
      }
    }
    return config;
  },
};

export default nextConfig;
