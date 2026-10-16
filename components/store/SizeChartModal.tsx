"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Ruler } from "lucide-react"
import { SIZE_CHART_DATA, type SizeMeasurement } from "@/lib/size-chart"
import { STORE_CONTACT } from "@/lib/contact"

export { SIZE_CHART_DATA, type SizeMeasurement }

interface SizeChartModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SizeChartModal({ isOpen, onClose }: SizeChartModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-w-[calc(100%-2rem)] p-0 bg-background border border-border overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-muted-foreground" />
            <DialogTitle className="font-heading text-2xl font-normal text-foreground">
              Size Chart
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All measurements below are in <span className="font-medium text-foreground">Inches</span>.
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-6 pt-2">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b border-border bg-muted/60 text-foreground font-semibold">
                  <th className="py-2.5 px-3 text-left uppercase tracking-wider font-semibold">
                    Size
                  </th>
                  <th className="py-2.5 px-3 text-center uppercase tracking-wider font-semibold">
                    Bust
                  </th>
                  <th className="py-2.5 px-3 text-center uppercase tracking-wider font-semibold">
                    Waist
                  </th>
                  <th className="py-2.5 px-3 text-center uppercase tracking-wider font-semibold">
                    Hip
                  </th>
                  <th className="py-2.5 px-3 text-center uppercase tracking-wider font-semibold">
                    Shoulder
                  </th>
                  <th className="py-2.5 px-3 text-center uppercase tracking-wider font-semibold">
                    Length
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SIZE_CHART_DATA.map((row) => (
                  <tr
                    key={row.size}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {row.size}
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground tabular-nums">
                      {row.bust}
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground tabular-nums">
                      {row.waist}
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground tabular-nums">
                      {row.hip}
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground tabular-nums">
                      {row.shoulder}
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground tabular-nums">
                      {row.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 pt-4 border-t border-border text-xs text-muted-foreground space-y-3">
            <p className="font-heading text-sm font-semibold text-foreground">How to measure</p>
            <ul className="space-y-1.5 text-xs">
              <li>
                <strong className="font-medium text-foreground">Bust:</strong> around the fullest part of your bust
              </li>
              <li>
                <strong className="font-medium text-foreground">Waist:</strong> around your natural waistline
              </li>
              <li>
                <strong className="font-medium text-foreground">Hip:</strong> around the fullest part of your hips
              </li>
              <li>
                <strong className="font-medium text-foreground">Length:</strong> from the top of the shoulder down to the hem
              </li>
            </ul>

            <div className="rounded-md bg-muted/40 border border-border/40 p-3 mt-3">
              <p className="text-xs text-muted-foreground">
                Between two sizes?{" "}
                <a
                  href={STORE_CONTACT.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
                >
                  Message us on WhatsApp at {STORE_CONTACT.whatsapp}
                </a>{" "}
                and we will help you choose.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
