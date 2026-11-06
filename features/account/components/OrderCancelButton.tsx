"use client"

import * as React from "react"
import { StoreButton } from "@/components/store/StoreButton"
import { CustomerOrderCancelDialog } from "./CustomerOrderCancelDialog"
import { XCircle } from "lucide-react"

interface OrderCancelButtonProps {
  orderNumber: string
  orderId: string
  totalFils: number
  paymentMethod: "card" | "cod"
  paymentStatus?: string
  userEmail?: string
  variant?: "outline" | "destructive" | "ghost"
  className?: string
}

export function OrderCancelButton({
  orderNumber,
  orderId,
  totalFils,
  paymentMethod,
  paymentStatus,
  userEmail,
  variant = "outline",
  className,
}: OrderCancelButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <>
      <StoreButton
        variant={variant}
        onClick={() => setIsOpen(true)}
        className={className || "w-full text-xs uppercase tracking-wider h-9 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"}
      >
        <XCircle className="mr-1.5 h-3.5 w-3.5" />
        Cancel Order
      </StoreButton>

      <CustomerOrderCancelDialog
        orderNumber={orderNumber}
        orderId={orderId}
        totalFils={totalFils}
        paymentMethod={paymentMethod}
        paymentStatus={paymentStatus}
        userEmail={userEmail}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}

