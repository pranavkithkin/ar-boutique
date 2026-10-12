import { z } from "zod"

/**
 * Server-only environment variables schema.
 * These variables contain secrets and MUST NEVER be exposed to the browser.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Supabase (Database & Admin Service Role)
  SUPABASE_SECRET_KEY: z.string().min(1, "SUPABASE_SECRET_KEY is required"),

  // Cloudinary (Product Media Storage & Transformations - ADR-038)
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  CLOUDINARY_FOLDER: z.enum(["ar-dev", "ar-staging", "ar-prod"]).default("ar-dev"),

  // Clerk (Customer Authentication - Phase 5)
  CLERK_SECRET_KEY: z.string().min(1).optional(),

  // Resend (Transactional Emails - ADR-009)
  RESEND_API_KEY: z.string().min(1).optional(),

  // Stripe (Card Payments & Webhooks - ADR-033)
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Sentry & Operations
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
})

/**
 * Client-accessible environment variables schema.
 * Must begin with NEXT_PUBLIC_ to be inlined into the client bundle.
 */
const clientSchema = z.object({
  // Supabase (Client access with public anon/publishable key & RLS)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),

  // Cloudinary (Public cloud name for asset delivery)
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1, "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is required"),

  // Clerk (Customer Authentication frontend SDK - Phase 5)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1).default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().min(1).default("/sign-up"),

  // Stripe (Client Stripe Elements)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),

  // Sentry (Client Error Monitoring)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")),
})

export type ServerEnv = z.infer<typeof serverSchema>
export type ClientEnv = z.infer<typeof clientSchema>
export type Env = ServerEnv & ClientEnv

const isServer = typeof window === "undefined"
const skipValidation = !!process.env.SKIP_ENV_VALIDATION

// 1. Validate Client Variables
const clientResult = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
})

if (!clientResult.success && !skipValidation) {
  console.error("❌ Invalid client environment variables:")
  console.error(JSON.stringify(clientResult.error.flatten().fieldErrors, null, 2))
  throw new Error("Invalid client environment variables. Check your .env file.")
}

// 2. Validate Server Variables (only on server)
let serverData: ServerEnv = {} as ServerEnv

if (isServer) {
  const serverResult = serverSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    CLOUDINARY_CLOUD_NAME:
      process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
  })

  if (!serverResult.success && !skipValidation) {
    console.error("❌ Invalid server environment variables:")
    console.error(JSON.stringify(serverResult.error.flatten().fieldErrors, null, 2))
    throw new Error("Invalid server environment variables. Check your .env file.")
  }

  if (serverResult.success) {
    serverData = serverResult.data
  }
}

const clientData = (clientResult.success ? clientResult.data : {}) as ClientEnv

/**
 * Validated and type-safe environment variables proxy.
 *
 * - Guarantees all variables meet Zod schema requirements.
 * - Protects server secrets: throws an error if accessed in client code.
 * - Provides full autocomplete for both server and client keys.
 */
export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (typeof prop !== "string") return undefined

    // Client variables are safe anywhere
    if (prop.startsWith("NEXT_PUBLIC_")) {
      return clientData[prop as keyof ClientEnv]
    }

    // Accessing server variable on the client is a strict security violation
    if (!isServer) {
      throw new Error(
        `❌ Security Violation: Attempted to access server environment variable "${prop}" in client code. Only NEXT_PUBLIC_* variables can be exposed to the browser.`
      )
    }

    return serverData[prop as keyof ServerEnv]
  },
})
