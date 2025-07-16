import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import withBundleAnalyzer from "@next/bundle-analyzer";

/** Handle __filename and __dirname in ESM */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Bundle Analyzer wrapper */
const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  env: {
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    POSTHOG_HOST: process.env.POSTHOG_HOST,
  },

  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "").replace(
            /\/.*$/,
            "",
          ) || "cvnertrkcwjjdrnnjswk.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/listings/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Access-Control-Allow-Origin",
            value:
              process.env.NEXT_PUBLIC_CORS_ORIGIN || "https://routteme.com",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: process.env.NEXT_PUBLIC_SUPABASE_URL; font-src 'self' data:; connect-src 'self' https://api.routteme.com; frame-src 'self' https://www.youtube.com https://player.vimeo.com;",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },

  webpack(config, { isServer }) {
    config.cache = {
      type: "filesystem",
      compression: false,
      allowCollectingMemory: true,
      buildDependencies: {
        config: [`${__dirname}/next.config.mjs`],
      },
    };

    return config;
  },
};

export default withAnalyzer(nextConfig);
