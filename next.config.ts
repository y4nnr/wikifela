import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.114", "127.0.0.1", "localhost"],
  async redirects() {
    return [
      {
        source: "/ultime",
        destination: "/enquete",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
