import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.80",
    "192.168.1.80:3000",
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
  ],
  experimental: {
    serverActions: {
      // allowedOrigins lists extra origins beyond the app's own host that are
      // permitted to invoke Server Actions (CSRF protection).
      // On standard Vercel deployments Next.js automatically trusts same-origin
      // requests; these entries are only required for local LAN development.
      // Payload size limit is not needed here because no Server Action accepts large file bytes:
      // both photo and video uploads use direct browser-to-Supabase signed upload
      // URLs — file bytes bypass Next.js / Vercel entirely.
      allowedOrigins: [
        "192.168.1.80:3000",
        "192.168.1.80",
        "localhost:3000",
        "localhost",
        "127.0.0.1:3000",
        "127.0.0.1",
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
