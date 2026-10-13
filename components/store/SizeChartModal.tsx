"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Ruler } from "lucide-react"

export interface SizeMeasurement {
  size: string
  bust: number
  waist: number
  hip: number
  shoulder: string
}

export const SIZE_CHART_DATA: SizeMeasurement[] = [
  { size: "XS", bust: 32, waist: 28, hip: 36, shoulder: "13.5" },
  { size: "S", bust: 34, waist: 30, hip: 38, shoulder: "14" },
  { size: "M", bust: 36, waist: 32, hip: 40, shoulder: "14.5" },
  { size: "L", bust: 38, waist: 34, hip: 42, shoulder: "15" },
  { size: "XL", bust: 40, waist: 36, hip: 44, shoulder: "15.5" },
  { size: "XXL", bust: 42, waist: 38, hip: 46, shoulder: "16" },
  { size: "XXXL", bust: 44, waist: 40, hip: 48, shoulder: "16.5" },
]

interface SizeChartModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SizeChartModal({ isOpen, onClose }: SizeChartModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-w-[calc(100%-2rem)] p-6 bg-background border border-border">
        <DialogHeader className="mb-4">
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

        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-foreground font-semibold">
                <th className="py-3 px-3 text-left uppercase tracking-wider font-semibold">
                  Size
                </th>
                <th className="py-3 px-3 text-center uppercase tracking-wider font-semibold">
                  Bust
                </th>
                <th className="py-3 px-3 text-center uppercase tracking-wider font-semibold">
                  Waist
                </th>
                <th className="py-3 px-3 text-center uppercase tracking-wider font-semibold">
                  Hip
                </th>
                <th className="py-3 px-3 text-center uppercase tracking-wider font-semibold">
                  Shoulder
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SIZE_CHART_DATA.map((row) => (
                <tr
                  key={row.size}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-3 font-semibold text-foreground">
                    {row.size}
                  </td>
                  <td className="py-3 px-3 text-center text-muted-foreground tabular-nums">
                    {row.bust}
                  </td>
                  <td className="py-3 px-3 text-center text-muted-foreground tabular-nums">
                    {row.waist}
                  </td>
                  <td className="py-3 px-3 text-center text-muted-foreground tabular-nums">
                    {row.hip}
                  </td>
                  <td className="py-3 px-3 text-center text-muted-foreground tabular-nums">
                    {row.shoulder}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground space-y-2.5">
          <p className="font-heading text-sm font-semibold text-foreground">How to Measure:</p>
          <div>
            <p className="font-medium text-foreground">1. Bust:</p>
            <p className="leading-relaxed">Measure around the fullest part of your bust, keeping the tape parallel to the ground.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">2. Waist:</p>
            <p className="leading-relaxed">Find the narrowest part of your waist, usually an inch above your belly button. Keep the tape comfortably snug.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">3. Hip:</p>
            <p className="leading-relaxed">Measure around the fullest part of your hips, ensuring the tape is parallel to the ground.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">4. Shoulder:</p>
            <p className="leading-relaxed">Measure from the edge of one shoulder across your back to the same point on the opposite shoulder.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
