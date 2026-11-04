import { createClient } from "@/lib/supabase/server"
import { generateStockSheetTemplateBuffer } from "@/lib/sheets/template"

export const dynamic = "force-dynamic"

/**
 * Route Handler: GET /api/admin/catalogue-template
 *
 * Downloads a ready-to-fill sample boutique stock sheet template (.xlsx)
 * with client schema headers, formatted sample rows, and an instructions tab.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized. Admin session required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const buffer = await generateStockSheetTemplateBuffer()
    const filename = `AR-Boutique-Stock-Sample-Template.xlsx`

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (err: unknown) {
    console.error("Template generation error:", err)
    const msg = err instanceof Error ? err.message : "Failed to generate sample template."
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
