import { FREE_DELIVERY_MESSAGE } from "@/lib/money"
import { getStoreSettings } from "@/features/admin/settings/actions"

interface AnnouncementBarProps {
  text?: string
}

export async function AnnouncementBar({ text }: AnnouncementBarProps) {
  // If text is explicitly passed via props, respect it
  if (text) {
    return (
      <div className="bg-primary text-primary-foreground text-center py-2 text-[12px] uppercase tracking-[0.12em] font-medium">
        {text}
      </div>
    )
  }

  // Otherwise, read live configuration from database settings
  const settings = await getStoreSettings()

  // If announcement bar is disabled in admin settings, do not render
  if (!settings.announcement_bar_enabled) {
    return null
  }

  const displayText =
    settings.announcement_bar_text?.trim() || FREE_DELIVERY_MESSAGE

  return (
    <div className="bg-primary text-primary-foreground text-center py-2 text-[12px] uppercase tracking-[0.12em] font-medium">
      {displayText}
    </div>
  )
}
