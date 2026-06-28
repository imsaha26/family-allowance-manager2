import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Stellar SDK requires these Node.js built-ins to be polyfilled / ignored ──
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        http: false,
        https: false,
        zlib: false,
      };
    }

    // Allow importing .wasm files for potential future use
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },

  // ── Image optimization ──
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "stellar.expert",
      },
    ],
  },

  // ── Security headers ──
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://soroban-testnet.stellar.org https://horizon-testnet.stellar.org https://friendbot.stellar.org wss:",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ── Redirect root to dashboard when wallet is connected ──
  // (handled client-side in landing page component instead)

  // ── TypeScript strict mode ──
  typescript: {
    ignoreBuildErrors: false,
  },

  // ── ESLint ──
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ── Enable React strict mode ──
  reactStrictMode: true,
};

export default nextConfig;
