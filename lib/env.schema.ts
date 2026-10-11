import { z } from "zod";

// Pure validation only. Never read process.env or import server-only here:
// Next's config loader and unit tests must also be able to use these schemas.
const nonBlank = z
  .string()
  .min(1)
  .refine((value) => value === value.trim() && !/[\r\n]/.test(value));

const nodeEnvSchema = z
  .enum(["development", "test", "production"])
  .default("development");

const supabaseUrl = nonBlank.url().refine((value) => {
  try {
    const url = new URL(value);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    return (
      (url.protocol === "https:" || (url.protocol === "http:" && loopback)) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      (url.pathname === "" || url.pathname === "/")
    );
  } catch {
    // Refinements can run after another check fails; never leak URL's input
    // through an uncaught TypeError.
    return false;
  }
});

const publicShape = {
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  // This project uses modern publishable keys, not secret/service-role keys.
  // Legacy anon JWT support is deliberately not implied.
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: nonBlank.regex(
    /^sb_publishable_[A-Za-z0-9_-]+$/,
  ),
};

export const publicEnvSchema = z.object(publicShape);

export const serverEnvSchema = z
  .object({
    ...publicShape,
    NODE_ENV: nodeEnvSchema,
    CLOUDINARY_CLOUD_NAME: nonBlank.regex(/^[a-z0-9][a-z0-9_-]*$/),
    CLOUDINARY_API_KEY: nonBlank.regex(/^[0-9]+$/),
    CLOUDINARY_API_SECRET: nonBlank,
    CLOUDINARY_FOLDER: z.enum(["ar-dev", "ar-staging", "ar-prod"]),
  })
  .superRefine((env, ctx) => {
    if (
      env.NODE_ENV === "production" &&
      !env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://")
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SUPABASE_URL"],
        message: "HTTPS is required for production builds.",
      });
    }
  });

export type PublicEnv = Readonly<z.infer<typeof publicEnvSchema>>;
export type ServerEnv = Readonly<z.infer<typeof serverEnvSchema>>;

function parse<T extends object>(
  schema: z.ZodType<T>,
  input: unknown,
): Readonly<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    // Do not attach ZodError, input, issue.message, or a cause: those can
    // contain credentials. Only schema-controlled variable names escape.
    const fields = [
      ...new Set(
        result.error.issues.map((issue) =>
          issue.path.length ? String(issue.path[0]) : "environment",
        ),
      ),
    ].sort();
    throw new Error(
      `Invalid environment configuration: ${fields.join(", ")}. Check .env.example; values are redacted.`,
    );
  }
  return Object.freeze(result.data);
}

export function parsePublicEnv(input: unknown): PublicEnv {
  return parse(publicEnvSchema, input);
}

export function parseServerEnv(input: unknown): ServerEnv {
  return parse(serverEnvSchema, input);
}
