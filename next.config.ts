import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  swSrc: "public/sw.js", // Keep custom push notification SW logic
});

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "pg"],
  transpilePackages: [
    "@fullcalendar/common",
    "@fullcalendar/core",
    "@fullcalendar/react",
    "@fullcalendar/daygrid",
    "@fullcalendar/timegrid",
    "@fullcalendar/interaction"
  ],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['simag.alwanabbas.my.id'],
};

export default withPWA(nextConfig);
