import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { parsePublicEnv, parseServerEnv } from "../../lib/env.schema";

// Synthetic fixtures only. No calls to Supabase or Cloudinary.
const valid = {
  NODE_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_unit_test_only",
  CLOUDINARY_CLOUD_NAME: "unit-test-cloud",
  CLOUDINARY_API_KEY: "1234567890",
  CLOUDINARY_API_SECRET: "synthetic-secret-not-a-real-credential",
  CLOUDINARY_FOLDER: "ar-staging",
};

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "CLOUDINARY_FOLDER",
] as const;

describe("TASK-005 environment validation", () => {
  it("accepts the current six-variable staging configuration in a production build", () => {
    expect(parseServerEnv(valid)).toEqual(valid);
  });

  it.each(required)("rejects missing %s", (key) => {
    const input: Record<string, string> = { ...valid };
    delete input[key];
    expect(() => parseServerEnv(input)).toThrow(key);
  });

  it.each(required)("rejects blank %s", (key) => {
    expect(() => parseServerEnv({ ...valid, [key]: "" })).toThrow(key);
  });

  it.each(required)("rejects whitespace-only %s", (key) => {
    expect(() => parseServerEnv({ ...valid, [key]: " \n " })).toThrow(key);
  });

  it.each(required)("rejects surrounding whitespace without normalizing %s", (key) => {
    expect(() =>
      parseServerEnv({ ...valid, [key]: ` ${valid[key]} ` }),
    ).toThrow(key);
  });

  it.each([
    "not-a-url",
    "ftp://example.supabase.co",
    "http://example.supabase.co",
    "https://user:password@example.supabase.co",
    "https://example.supabase.co/rest/v1",
    "https://example.supabase.co?secret=example",
    "https://example.supabase.co#fragment",
  ])("rejects unsafe or non-base API URL %s", (url) => {
    expect(() =>
      parseServerEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: url }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it.each(["localhost", "127.0.0.1", "[::1]"])(
    "allows loopback HTTP for local development: %s",
    (host) => {
      expect(
        parseServerEnv({
          ...valid,
          NODE_ENV: "development",
          NEXT_PUBLIC_SUPABASE_URL: `http://${host}:54321`,
        }).NEXT_PUBLIC_SUPABASE_URL,
      ).toBe(`http://${host}:54321`);
    },
  );

  it("rejects loopback HTTP in a production build", () => {
    expect(() =>
      parseServerEnv({
        ...valid,
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it.each(["sb_secret_do_not_expose", "eyJhbGciOiJIUzI1NiJ9.payload.signature"])(
    "rejects secret keys and unsupported legacy JWTs in the public key slot",
    (key) => {
      expect(() =>
        parsePublicEnv({
          ...valid,
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
        }),
      ).toThrow("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    },
  );

  it("rejects malformed Cloudinary configuration", () => {
    expect(() =>
      parseServerEnv({ ...valid, CLOUDINARY_CLOUD_NAME: "https://cloud.invalid" }),
    ).toThrow("CLOUDINARY_CLOUD_NAME");
    expect(() =>
      parseServerEnv({ ...valid, CLOUDINARY_API_KEY: "abc" }),
    ).toThrow("CLOUDINARY_API_KEY");
    expect(() =>
      parseServerEnv({ ...valid, CLOUDINARY_FOLDER: "../ar-prod" }),
    ).toThrow("CLOUDINARY_FOLDER");
  });

  it.each(["ar-dev", "ar-staging", "ar-prod"])("accepts approved media root %s", (folder) => {
    expect(parseServerEnv({ ...valid, CLOUDINARY_FOLDER: folder }).CLOUDINARY_FOLDER).toBe(folder);
  });

  it("does not require future integration credentials", () => {
    expect(() => parseServerEnv(valid)).not.toThrow();
  });

  it("rejects an unsupported NODE_ENV and defaults only when it is absent", () => {
    expect(() => parseServerEnv({ ...valid, NODE_ENV: "staging" })).toThrow("NODE_ENV");
    expect(parseServerEnv({ ...valid, NODE_ENV: undefined }).NODE_ENV).toBe("development");
  });

  it("exposes only the two explicitly public fields", () => {
    const output = parsePublicEnv({ ...valid, EXTRA_SECRET: "do-not-return" });
    expect(Object.keys(output).sort()).toEqual([
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
    ]);
    expect(JSON.stringify(output)).not.toContain(valid.CLOUDINARY_API_SECRET);
    expect(Object.isFrozen(output)).toBe(true);
  });

  it("strips unrecognized platform fields and freezes the result", () => {
    const output = parseServerEnv({ ...valid, VERCEL: "1", EXTRA_SECRET: "hidden" });
    expect(output).toEqual(valid);
    expect(Object.isFrozen(output)).toBe(true);
  });

  it("does not mutate the supplied environment", () => {
    const input = { ...valid, EXTRA_SECRET: "preserve-in-input" };
    parseServerEnv(input);
    expect(input).toEqual({ ...valid, EXTRA_SECRET: "preserve-in-input" });
  });

  it("redacts invalid values, nested error objects and causes", () => {
    const marker = "DO_NOT_LOG_THIS_SECRET";
    let failure: unknown;
    try {
      parseServerEnv({
        ...valid,
        CLOUDINARY_API_SECRET: ` ${marker} `,
        CLOUDINARY_API_KEY: marker,
      });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    const error = failure as Error;
    expect(error.message).toContain("CLOUDINARY_API_SECRET");
    expect(error.message).toContain("CLOUDINARY_API_KEY");
    expect(`${error.message}\n${error.stack}\n${JSON.stringify(error)}`).not.toContain(marker);
    expect(error.cause).toBeUndefined();
    expect(error).not.toHaveProperty("issues");
  });

  it.each([undefined, null, [], "invalid"])("fails safely for a non-object input", (input) => {
    expect(() => parseServerEnv(input)).toThrow("Invalid environment configuration");
  });

  it("keeps the example synchronized with the six required application variables", () => {
    const example = readFileSync(resolve(".env.example"), "utf8");
    const keys = example.split("\n").filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => line.split("=")[0]).sort();
    expect(keys).toEqual([...required].sort());
  });

  it("guards server imports and validates Next startup without importing server-only", () => {
    const server = readFileSync(resolve("lib/env.ts"), "utf8");
    const client = readFileSync(resolve("lib/env.public.ts"), "utf8");
    const config = readFileSync(resolve("next.config.ts"), "utf8");
    expect(server).toContain('import "server-only"');
    expect(client).not.toContain("process.env.CLOUDINARY");
    expect(client).not.toContain('from "./env"');
    expect(client).toContain("process.env.NEXT_PUBLIC_SUPABASE_URL");
    expect(client).toContain("process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(config).toContain("parseServerEnv(process.env)");
    expect(config).not.toContain('from "./lib/env"');
  });
});
