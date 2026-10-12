import { FREE_DELIVERY_MESSAGE } from "@/lib/money"

interface AnnouncementBarProps {
  text?: string
}

export function AnnouncementBar({
  text = FREE_DELIVERY_MESSAGE,
}: AnnouncementBarProps) {
  return (
    <div className="bg-primary text-primary-foreground text-center py-2 text-[12px] uppercase tracking-[0.12em] font-medium">
      {text}
    </div>
  )
}
