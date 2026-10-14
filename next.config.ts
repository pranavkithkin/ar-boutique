import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/shipping",
        destination: "/policies/shipping",
        permanent: true,
      },
      {
        source: "/returns",
        destination: "/policies/returns",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
