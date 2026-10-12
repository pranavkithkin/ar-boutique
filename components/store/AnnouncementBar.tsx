interface AnnouncementBarProps {
  text?: string
}

export function AnnouncementBar({
  text = "Complimentary delivery on orders over AED 150 across the UAE",
}: AnnouncementBarProps) {
  return (
    <div className="bg-primary text-primary-foreground text-center py-2 text-[12px] uppercase tracking-[0.12em] font-medium">
      {text}
    </div>
  )
}
