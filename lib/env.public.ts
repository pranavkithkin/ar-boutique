import { parsePublicEnv } from "./env.schema";

// Direct property accesses are required for Next.js build-time substitution.
// Do not replace with process.env, destructuring, or dynamic key iteration.
export const publicEnv = parsePublicEnv({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
