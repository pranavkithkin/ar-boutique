import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { canRevealTrackingId } from "../access"

interface Props {
  orderId: string
  customerSubject?: string | null
  storedSession?: string | null
  providedSession?: string | null
}

export async function OrderTrackingReference({ orderId, customerSubject, storedSession, providedSession }: Props) {
  let signedInSubject: string | null = null
  if (customerSubject) {
    try {
      signedInSubject = (await auth()).userId
    } catch {
      // Guests can prove access through their Checkout Session instead.
    }
  }

  if (!canRevealTrackingId(customerSubject, signedInSubject, storedSession, providedSession)) return null

  return (
    <div className="space-y-2 text-sm">
      <p className="text-muted-foreground">Order ID <span className="block break-all font-mono text-foreground">{orderId}</span></p>
      <Link href="/track-order" className="underline underline-offset-4">Track Your Order</Link>
      <p className="text-xs text-muted-foreground">Use this ID and your checkout email to check your order status.</p>
    </div>
  )
}
