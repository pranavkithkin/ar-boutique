"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AdminCustomerListItem } from "../types"
import { formatAED } from "@/lib/money"
import {
  ShieldAlert,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  User,
  ShoppingBag,
} from "lucide-react"

interface CustomersTableProps {
  customers: AdminCustomerListItem[]
  total: number
  currentPage: number
  totalPages: number
  pageSize: number
  startTransition?: React.TransitionStartFunction
}

export function CustomersTable({
  customers,
  total,
  currentPage,
  totalPages,
  pageSize,
  startTransition: externalStartTransition,
}: CustomersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, internalStartTransition] = React.useTransition()
  const triggerTransition = externalStartTransition || internalStartTransition

  function goToPage(page: number) {
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", String(page))
    triggerTransition(() => router.push(`/admin/customers?${next.toString()}`))
  }

  if (customers.length === 0) {
    return (
      <div className="border border-border bg-card p-12 text-center rounded-none space-y-3">
        <div className="size-12 bg-muted/40 border border-border flex items-center justify-center mx-auto text-muted-foreground">
          <User className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-sans text-base font-semibold text-foreground">No customers found</h3>
          <p className="text-xs font-sans text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or checking back after customers place orders.
          </p>
        </div>
      </div>
    )
  }

  const startRecord = (currentPage - 1) * pageSize + 1
  const endRecord = Math.min(currentPage * pageSize, total)

  return (
    <div className="space-y-4">
      <div className="border border-border bg-card rounded-none overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30 border-b border-border">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[280px] text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground h-11">
                Customer
              </TableHead>
              <TableHead className="text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground h-11">
                Contact
              </TableHead>
              <TableHead className="text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground h-11 text-right">
                Total Spend
              </TableHead>
              <TableHead className="text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground h-11 text-center">
                Orders
              </TableHead>
              <TableHead className="text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground h-11">
                COD Status
              </TableHead>
              <TableHead className="text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground h-11">
                Last Activity
              </TableHead>
              <TableHead className="w-[100px] text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground h-11 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {customers.map((c) => {
              const displayName = c.fullName || "Guest Customer"
              const initial = displayName.charAt(0).toUpperCase()
              const avgSpend = c.totalOrders > 0 ? Math.round(c.totalSpendFils / c.totalOrders) : 0

              return (
                <TableRow
                  key={c.id}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/customers/${c.id}`)}
                >
                  {/* Customer Identity */}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 bg-primary/10 border border-primary/20 text-primary font-sans font-semibold flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <div className="space-y-0.5 truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-sans font-medium text-xs text-foreground truncate">
                            {displayName}
                          </span>
                          {c.clerkUserId ? (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 rounded-none border-primary/30 text-primary uppercase font-sans">
                              Member
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 rounded-none text-muted-foreground uppercase font-sans">
                              Guest
                            </Badge>
                          )}
                        </div>
                        {c.notes && (
                          <p className="text-[11px] font-sans text-muted-foreground truncate italic">
                            &quot;{c.notes}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell className="py-3.5">
                    <div className="space-y-0.5 text-xs font-sans">
                      <p className="text-foreground font-mono truncate">{c.email}</p>
                      <p className="text-muted-foreground text-[11px]">{c.phone || "—"}</p>
                    </div>
                  </TableCell>

                  {/* Spend */}
                  <TableCell className="py-3.5 text-right">
                    <div className="space-y-0.5">
                      <span className="font-sans font-semibold text-xs text-foreground block">
                        {formatAED(c.totalSpendFils)}
                      </span>
                      {c.totalOrders > 1 && (
                        <span className="text-[10px] font-sans text-muted-foreground block">
                          Avg {formatAED(avgSpend)}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Orders Count */}
                  <TableCell className="py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 font-medium text-xs text-foreground">
                      <ShoppingBag className="size-3 text-muted-foreground" />
                      {c.totalOrders}
                    </span>
                  </TableCell>

                  {/* COD Status */}
                  <TableCell className="py-3.5">
                    <div className="space-y-0.5">
                      {c.codDisabled ? (
                        <Badge
                          variant="destructive"
                          className="rounded-none text-[10px] uppercase tracking-wider flex items-center gap-1 w-fit"
                        >
                          <ShieldAlert className="size-3" />
                          Blocked
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="rounded-none text-[10px] uppercase tracking-wider text-emerald-600 border-emerald-500/30 bg-emerald-500/5 flex items-center gap-1 w-fit"
                        >
                          <ShieldCheck className="size-3" />
                          Allowed
                        </Badge>
                      )}

                      {c.codRefusals > 0 && (
                        <p className="text-[10px] text-destructive font-medium">
                          {c.codRefusals} refusal{c.codRefusals > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Last Activity */}
                  <TableCell className="py-3.5 text-xs text-muted-foreground">
                    {c.lastOrderAt ? (
                      new Date(c.lastOrderAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "rounded-none text-xs font-sans h-7 px-2.5 font-normal hover:bg-primary hover:text-primary-foreground inline-flex items-center"
                      )}
                    >
                      Manage
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div>
          Showing <span className="font-medium text-foreground">{startRecord}</span> to{" "}
          <span className="font-medium text-foreground">{endRecord}</span> of{" "}
          <span className="font-medium text-foreground">{total}</span> customers
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            className="rounded-none h-8 px-2 text-xs"
          >
            <ChevronLeft className="size-3.5 mr-1" />
            Previous
          </Button>
          <span className="text-xs px-2 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
            className="rounded-none h-8 px-2 text-xs"
          >
            Next
            <ChevronRight className="size-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
