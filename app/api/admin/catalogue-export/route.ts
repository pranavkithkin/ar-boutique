import { createClient } from "@/lib/supabase/server"
import { exportCatalogueToExcelBuffer } from "@/lib/sheets/exporter"

export const dynamic = "force-dynamic"

/**
 * Route Handler: GET /api/admin/catalogue-export
 *
 * Exports current products, SKUs, prices, stock levels, and garment details
 * into an Excel (.xlsx) file matching the client's stock sheet schema (TASK-115).
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
    const buffer = await exportCatalogueToExcelBuffer()
    const dateStr = new Date().toISOString().slice(0, 10)
    const filename = `AR-Boutique-Stock-${dateStr}.xlsx`

    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (err: unknown) {
    console.error("Export generation error:", err)
    const msg = err instanceof Error ? err.message : "Failed to generate catalogue export."
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
