import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
      {
        source: "/sidepanel",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOW-FROM https://meet.google.com",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors https://meet.google.com",
          },
        ],
      },
      {
        source: "/mainstage",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOW-FROM https://meet.google.com",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors https://meet.google.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
