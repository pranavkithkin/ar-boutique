import { Check, Circle } from "lucide-react"
import type { TrackingTimelineStep } from "../timeline"

const dateFormat = new Intl.DateTimeFormat("en-AE", {
  day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dubai",
})

export function OrderTimeline({ steps }: { steps: TrackingTimelineStep[] }) {
  return (
    <div className="space-y-4 border-t border-border pt-5">
      <h3 className="font-sans text-sm font-semibold text-foreground">Order timeline</h3>
      <ol aria-label="Order timeline">
        {steps.map((step, index) => (
          <li key={step.id} aria-current={step.state === "current" ? "step" : undefined} className="relative flex gap-3 pb-6 last:pb-0">
            {index < steps.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-3 top-6 w-px bg-border" />}
            <span aria-hidden="true" className={`relative flex size-6 shrink-0 items-center justify-center rounded-full border ${step.state === "upcoming" ? "border-border bg-muted text-muted-foreground" : "border-primary bg-primary text-primary-foreground"}`}>
              {step.state === "complete" ? <Check className="size-3.5" /> : <Circle className="size-2.5" />}
            </span>
            <div className="min-w-0 space-y-1 pt-0.5">
              <p className={`font-sans text-sm ${step.state === "upcoming" ? "text-muted-foreground" : "font-medium text-foreground"}`}>
                {step.label}
                <span className="sr-only"> — {step.state === "complete" ? "Completed" : step.state === "current" ? "Current status" : "Upcoming"}</span>
              </p>
              {step.occurredAt && <time dateTime={step.occurredAt} className="block text-xs text-muted-foreground">{dateFormat.format(new Date(step.occurredAt))}</time>}
              {!step.occurredAt && step.state === "upcoming" && <p className="text-xs text-muted-foreground">Not yet reached</p>}
            </div>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">Times shown in UAE time.</p>
    </div>
  )
}
