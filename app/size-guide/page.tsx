import type { Metadata } from "next"
import { StoreHeader } from "@/components/store/StoreHeader"
import { StoreFooter } from "@/components/store/StoreFooter"
import { SIZE_CHART_DATA } from "@/components/store/SizeChartModal"
import { Ruler } from "lucide-react"

export const metadata: Metadata = {
  title: "Size Guide | AR Boutique",
  description: "Measurement and size guide for AR Boutique collections.",
}

export default function SizeGuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
              <Ruler className="h-6 w-6 text-foreground" />
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl text-foreground mb-3">
              Size Guide
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Find your perfect fit. All measurements in the chart below are given in{" "}
              <span className="font-semibold text-foreground">Inches</span>.
            </p>
          </div>

          <div className="border border-border bg-card rounded-xs overflow-hidden shadow-xs mb-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-foreground font-semibold">
                    <th className="py-3.5 px-4 text-left uppercase tracking-wider font-semibold">
                      Size
                    </th>
                    <th className="py-3.5 px-4 text-center uppercase tracking-wider font-semibold">
                      Bust
                    </th>
                    <th className="py-3.5 px-4 text-center uppercase tracking-wider font-semibold">
                      Waist
                    </th>
                    <th className="py-3.5 px-4 text-center uppercase tracking-wider font-semibold">
                      Hip
                    </th>
                    <th className="py-3.5 px-4 text-center uppercase tracking-wider font-semibold">
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
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {row.size}
                      </td>
                      <td className="py-3.5 px-4 text-center text-muted-foreground tabular-nums">
                        {row.bust}
                      </td>
                      <td className="py-3.5 px-4 text-center text-muted-foreground tabular-nums">
                        {row.waist}
                      </td>
                      <td className="py-3.5 px-4 text-center text-muted-foreground tabular-nums">
                        {row.hip}
                      </td>
                      <td className="py-3.5 px-4 text-center text-muted-foreground tabular-nums">
                        {row.shoulder}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-border bg-muted/30 rounded-xs p-6 text-xs sm:text-sm text-muted-foreground space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
              How to Measure:
            </h2>
            <div>
              <p className="font-semibold text-foreground">1. Bust:</p>
              <p className="leading-relaxed">Measure around the fullest part of your bust, keeping the tape parallel to the ground.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">2. Waist:</p>
              <p className="leading-relaxed">Find the narrowest part of your waist, usually an inch above your belly button. Keep the tape comfortably snug.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">3. Hip:</p>
              <p className="leading-relaxed">Measure around the fullest part of your hips, ensuring the tape is parallel to the ground.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">4. Shoulder:</p>
              <p className="leading-relaxed">Measure from the edge of one shoulder across your back to the same point on the opposite shoulder.</p>
            </div>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  )
}
