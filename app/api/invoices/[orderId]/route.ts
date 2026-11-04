import { NextRequest, NextResponse } from "next/server"
import { getInvoiceData } from "@/lib/invoice"
import { renderBilingualInvoiceHtml } from "@/lib/invoice-template"

interface RouteProps {
  params: Promise<{
    orderId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const { orderId } = await params
    if (!orderId) {
      return new NextResponse("Order ID is required", { status: 400 })
    }

    const data = await getInvoiceData(orderId)
    if (!data) {
      return new NextResponse("Invoice not found or order does not exist", { status: 404 })
    }

    const { searchParams } = request.nextUrl
    const autoPrint =
      searchParams.get("print") === "1" ||
      searchParams.get("download") === "1" ||
      searchParams.get("action") === "print"

    const html = renderBilingualInvoiceHtml(data, autoPrint)

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    })
  } catch (err: unknown) {
    console.error("[Invoice Route] Error generating invoice:", err)
    return new NextResponse("Internal server error generating tax invoice", { status: 500 })
  }
}
