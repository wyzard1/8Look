import type { NextConfig } from "next";

function imageRemotePatterns() {
  const endpoints = [
    process.env.MINIO_ENDPOINT,
    process.env.MINIO_PUBLIC_ENDPOINT,
    "http://localhost:9000",
    "http://127.0.0.1:9000",
  ];

  return endpoints.flatMap((endpoint) => {
    if (!endpoint) return [];

    try {
      const url = new URL(endpoint);

      return [{
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/**",
      }];
    } catch {
      return [];
    }
  });
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: imageRemotePatterns(),
  },
};

export default nextConfig;
