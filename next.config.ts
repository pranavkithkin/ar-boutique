import type { NextConfig } from "next";
import { parseServerEnv } from "./lib/env.schema";

// Next loads .env* before evaluating config. Validate startup/build config here.
// Use the pure schema, not lib/env.ts: server-only cannot run in this loader.
// Never attach the parsed object to NextConfig.env; that would expose secrets.
parseServerEnv(process.env);

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
