import { z } from "zod"

// Public, read-only Route Handler. Keep database credentials out of client code;
// the publishable key uses anon RLS, never the service/admin key.
export const dynamic = "force-dynamic"
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  sort: z.number().int(),
  is_active: z.boolean(),
})
const configSchema = z.object({ url: z.string().url(), key: z.string().min(1) })
const batchSize = 500

export async function GET() {
  const config = configSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })
  if (!config.success) {
    return Response.json({ error: "Categories are temporarily unavailable." }, { status: 503, headers })
  }

  try {
    const url = new URL("/rest/v1/categories", config.data.url)
    url.searchParams.set("select", "id,name,slug,sort,is_active")
    url.searchParams.set("is_active", "eq.true")
    url.searchParams.set("order", "sort.asc,name.asc,id.asc")
    url.searchParams.set("limit", String(batchSize))
    const signal = AbortSignal.timeout(8_000)
    const categories: { id: string; name: string; slug: string }[] = []
    const seen = new Set<string>()

    // Page through the public catalogue instead of silently truncating menus
    // at PostgREST's row cap. The safety limit prevents an unbounded request.
    for (let page = 0; page < 20; page++) {
      url.searchParams.set("offset", String(page * batchSize))
      const response = await fetch(url, {
        headers: { apikey: config.data.key, Accept: "application/json" },
        cache: "no-store",
        signal,
      })
      if (!response.ok) throw new Error("Category read failed")
      const result = z.array(categorySchema).safeParse(await response.json())
      if (!result.success) throw new Error("Invalid category response")
      for (const category of result.data) {
        if (!category.is_active || seen.has(category.id)) continue
        seen.add(category.id)
        categories.push({ id: category.id, name: category.name, slug: category.slug })
      }
      if (result.data.length < batchSize) {
        return Response.json({ categories }, { headers })
      }
    }
    throw new Error("Category pagination limit exceeded")
  } catch {
    // Do not send upstream bodies, configuration values or stack traces.
    return Response.json({ error: "Categories are temporarily unavailable." }, { status: 503, headers })
  }
}
