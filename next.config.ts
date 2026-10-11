import type { NextConfig } from "next";
import { parseServerEnv } from "./lib/env.schema";

// Never attach validated secrets to NextConfig.env.
parseServerEnv(process.env);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "res.cloudinary.com",
      pathname: "/q8qdyl3f/image/upload/**",
      search: "",
    }],
  },
};

export default nextConfig;
