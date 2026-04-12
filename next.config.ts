import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "avatars.githubusercontent.com" }],
  },
  turbopack: {
    resolveAlias: {
      "@lobehub/ui": "./src/lib/stubs/lobehub-ui.tsx",
      "antd-style": "./src/lib/stubs/antd-style.ts",
      antd: "./src/lib/stubs/antd.ts",
    },
  },
};

export default nextConfig;
